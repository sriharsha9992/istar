/*

	Copyright (c) 2012, The Chinese University of Hong Kong

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.

*/

#include <boost/program_options.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/fstream.hpp>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#include <boost/date_time/posix_time/posix_time_types.hpp>
#include <mongo/client/dbclient.h>
#include <Poco/Net/MailMessage.h>
#include <Poco/Net/MailRecipient.h>
#include <Poco/Net/SMTPClientSession.h>
#include "thread_pool.hpp"
#include "receptor.hpp"
#include "ligand.hpp"
#include "grid_map_task.hpp"
#include "monte_carlo_task.hpp"
#include "summary.hpp"
#include "random_forest_test.hpp"

using namespace std;
using namespace std::chrono;
using namespace boost::filesystem;
using namespace boost::iostreams;
using namespace boost::gregorian;
using namespace boost::posix_time;
using namespace mongo;
using namespace bson;
using namespace Poco::Net;

inline static string now()
{
	return to_simple_string(second_clock::local_time()) + " ";
}

int main(int argc, char* argv[])
{
	// Check the required number of comand line arguments.
	if (argc != 5)
	{
		cout << "idock host user pwd jobs_path" << endl;
		return 0;
	}

	// Fetch command line arguments.
	const auto host = argv[1];
	const auto user = argv[2];
	const auto pwd = argv[3];
	const path jobs_path = argv[4];

	DBClientConnection conn;
	{
		// Connect to host and authenticate user.
		cout << now() << "Connecting to " << host << " and authenticating " << user << endl;
		string errmsg;
		if ((!conn.connect(host, errmsg)) || (!conn.auth("istar", user, pwd, errmsg)))
		{
			cerr << now() << errmsg << endl;
			return 1;
		}
	}

	// Initialize default values of constant arguments.
	const auto collection = "istar.idock";
	const auto jobid_fields = BSON("_id" << 1 << "scheduled" << 1);
	const auto param_fields = BSON("_id" << 0 << "ligands" << 1 << "mwt_lb" << 1 << "mwt_ub" << 1 << "lgp_lb" << 1 << "lgp_ub" << 1 << "ads_lb" << 1 << "ads_ub" << 1 << "pds_lb" << 1 << "pds_ub" << 1 << "hbd_lb" << 1 << "hbd_ub" << 1 << "hba_lb" << 1 << "hba_ub" << 1 << "psa_lb" << 1 << "psa_ub" << 1 << "chg_lb" << 1 << "chg_ub" << 1 << "nrb_lb" << 1 << "nrb_ub" << 1);
	const auto compt_fields = BSON("_id" << 0 << "email" << 1 << "submitted" << 1 << "description" << 1);
	const path ligands_path = "16_lig.pdbqt";
	const path headers_path = "16_hdr.bin";
	const size_t seed = system_clock::now().time_since_epoch().count();
	const size_t num_threads = thread::hardware_concurrency();
	const size_t num_trees = 512;
	const size_t phase1_num_mc_tasks = 32;
	const size_t phase2_num_mc_tasks = 128;
	const size_t max_conformations = 9;
	const size_t max_results = 9; // Maximum number of results obtained from a single Monte Carlo task.
	const fl energy_range = 3.0;
	const fl grid_granularity = 0.08;
	const auto epoch = boost::gregorian::date(1970, 1, 1);

	// Calculate the slice split points on the fly.
	const size_t total_ligands = 17224424;
	const size_t num_slices = 100;
	const size_t num_ligands_per_slice = total_ligands / num_slices;
	const size_t spare_ligands = total_ligands - num_ligands_per_slice * num_slices;
	array<size_t, num_slices + 1> slices;
	for (size_t i = 0, sum = 0; i <= num_slices; ++i)
	{
		slices[i] = sum;
		sum += num_ligands_per_slice + (i < spare_ligands);
	}

	// Initialize variables for job caching.
	OID _id;
	path job_path, receptor_path, box_path;
	double mwt_lb, mwt_ub, lgp_lb, lgp_ub, ads_lb, ads_ub, pds_lb, pds_ub;
	int num_ligands, hbd_lb, hbd_ub, hba_lb, hba_ub, psa_lb, psa_ub, chg_lb, chg_ub, nrb_lb, nrb_ub;
	box b;
	receptor rec;
	size_t num_gm_tasks;
	vector<array3d<fl>> grid_maps(XS_TYPE_SIZE);

	// Initialize program options.
	array<double, 3> center, size;
	using namespace boost::program_options;
	options_description input_options("input (required)");
	input_options.add_options()
		("center_x", value<double>(&center[0])->required())
		("center_y", value<double>(&center[1])->required())
		("center_z", value<double>(&center[2])->required())
		("size_x", value<double>(&size[0])->required())
		("size_y", value<double>(&size[1])->required())
		("size_z", value<double>(&size[2])->required())
		;

	// Initialize a thread pool and create worker threads for later use.
	thread_pool tp(num_threads);

	// Precalculate the scoring function in parallel.
	scoring_function sf;
	{
		// Precalculate reciprocal square root values.
		vector<fl> rs(scoring_function::Num_Samples, 0);
		for (size_t i = 0; i < scoring_function::Num_Samples; ++i)
		{
			rs[i] = sqrt(i * scoring_function::Factor_Inverse);
		}
		BOOST_ASSERT(rs.front() == 0);
		BOOST_ASSERT(rs.back() == scoring_function::Cutoff);

		// Populate the scoring function task container.
		for (size_t t1 =  0; t1 < XS_TYPE_SIZE; ++t1)
		for (size_t t2 = t1; t2 < XS_TYPE_SIZE; ++t2)
		{
			tp.push_back(packaged_task<void()>(bind(&scoring_function::precalculate, std::ref(sf), t1, t2, cref(rs))));
		}

		// Wait until all the scoring function tasks are completed.
		tp.sync();
	}

	// Load a random forest from file.
	forest f;
	f.load("rf.data");

	// Initialize a MT19937 random number generator.
	mt19937eng rng(seed);

	// Precalculate alpha values for determining step size in BFGS.
	array<fl, num_alphas> alphas;
	alphas[0] = 1;
	for (size_t i = 1; i < num_alphas; ++i)
	{
		alphas[i] = alphas[i - 1] * 0.1;
	}

	// Reserve space for containers.
	string line;
	vector<size_t> atom_types_to_populate; atom_types_to_populate.reserve(XS_TYPE_SIZE);
	ptr_vector<ptr_vector<result>> phase1_result_containers, phase2_result_containers;
	phase1_result_containers.resize(phase1_num_mc_tasks);
	phase2_result_containers.resize(phase2_num_mc_tasks);
	for (auto& rc : phase1_result_containers) rc.reserve(1);
	for (auto& rc : phase2_result_containers) rc.reserve(max_results);
	ptr_vector<result> phase1_results(1), phase2_results(max_results * phase2_num_mc_tasks);

	// Open files for reading.
	boost::filesystem::ifstream headers(headers_path);
	boost::filesystem::ifstream ligands(ligands_path);

	while (true)
	{
		// Fetch a job in a FCFS manner.
		BSONObj info;
		conn.runCommand("istar", BSON("findandmodify" << "idock" << "query" << BSON("scheduled" << BSON("$lt" << 100)) << "sort" << BSON("submitted" << 1) << "update" << BSON("$inc" << BSON("scheduled" << 1)) << "fields" << jobid_fields), info);
		const auto value = info["value"];
		if (value.isNull())
		{
			// Sleep for a while.
			this_thread::sleep_for(chrono::seconds(10));
			continue;
		}
		const auto job = value.Obj();

		// Refresh cache if it is a new job.
		if (_id != job["_id"].OID())
		{
			// Load job parameters from MongoDB.
			_id = job["_id"].OID();
			auto param_cursor = conn.query(collection, QUERY("_id" << _id), 1, 0, &param_fields);
			const auto param = param_cursor->next();
			num_ligands = param["ligands"].Int();
			mwt_lb = param["mwt_lb"].Number();
			mwt_ub = param["mwt_ub"].Number();
			lgp_lb = param["lgp_lb"].Number();
			lgp_ub = param["lgp_ub"].Number();
			ads_lb = param["ads_lb"].Number();
			ads_ub = param["ads_ub"].Number();
			pds_lb = param["pds_lb"].Number();
			pds_ub = param["pds_ub"].Number();
			hbd_lb = param["hbd_lb"].Int();
			hbd_ub = param["hbd_ub"].Int();
			hba_lb = param["hba_lb"].Int();
			hba_ub = param["hba_ub"].Int();
			psa_lb = param["psa_lb"].Int();
			psa_ub = param["psa_ub"].Int();
			chg_lb = param["chg_lb"].Int();
			chg_ub = param["chg_ub"].Int();
			nrb_lb = param["nrb_lb"].Int();
			nrb_ub = param["nrb_ub"].Int();

			// Load box and receptor from hard disk.
			job_path = jobs_path / _id.str();
			receptor_path = job_path / "receptor.pdbqt";
			box_path = job_path / "box.conf";
			while (!(exists(job_path) && exists(receptor_path) && exists(box_path)))
			{
				this_thread::sleep_for(chrono::seconds(1));
			}
			variables_map vm;
			boost::filesystem::ifstream box_ifs(box_path);
			store(parse_config_file(box_ifs, input_options), vm);
			vm.notify();
			b = box(vec3(center[0], center[1], center[2]), vec3(size[0], size[1], size[2]), grid_granularity);
			rec = receptor(receptor_path, b);

			// Reserve storage for grid map task container.
			num_gm_tasks = b.num_probes[0];

			// Clear grid maps.
			grid_maps.clear();
			grid_maps.resize(XS_TYPE_SIZE);
		}
		const auto slice = job["scheduled"].Int();

		// Perform phase 1.
		cout << now() << "Executing job " << _id << " phase 1 slice " << slice << endl;
		const auto slice_key = lexical_cast<string>(slice);
		const auto start_lig = slices[slice];
		const auto end_lig = slices[slice + 1];

		boost::filesystem::ofstream slice_csv(job_path / (slice_key + ".csv"));
		slice_csv.setf(ios::fixed, ios::floatfield);
		slice_csv << setprecision(3);
		headers.seekg(sizeof(size_t) * start_lig);
		for (auto idx = start_lig; idx < end_lig; ++idx)
		{
			// Locate a ligand.
			size_t header;
			headers.read((char*)&header, sizeof(size_t));
			ligands.seekg(header);

			// Check if the ligand satisfies the filtering conditions.
			getline(ligands, line);
			const auto mwt = right_cast<fl>(line, 21, 28);
			const auto lgp = right_cast<fl>(line, 30, 37);
			const auto ads = right_cast<fl>(line, 39, 46);
			const auto pds = right_cast<fl>(line, 48, 55);
			const auto hbd = right_cast<int>(line, 57, 59);
			const auto hba = right_cast<int>(line, 61, 63);
			const auto psa = right_cast<int>(line, 65, 67);
			const auto chg = right_cast<int>(line, 69, 71);
			const auto nrb = right_cast<int>(line, 73, 75);
			if (!((mwt_lb <= mwt) && (mwt <= mwt_ub) && (lgp_lb <= lgp) && (lgp <= lgp_ub) && (ads_lb <= ads) && (ads <= ads_ub) && (pds_lb <= pds) && (pds <= pds_ub) && (hbd_lb <= hbd) && (hbd <= hbd_ub) && (hba_lb <= hba) && (hba <= hba_ub) && (psa_lb <= psa) && (psa <= psa_ub) && (chg_lb <= chg) && (chg <= chg_ub) && (nrb_lb <= nrb) && (nrb <= nrb_ub))) continue;

			// Obtain ligand ID. ZINC IDs are 8-character long.
			const auto lig_id = line.substr(11, 8);

			// Filter out smiles line.
			getline(ligands, line);
			const string smiles = line.substr(11);

			// Filter out supplier line.
			getline(ligands, line);

			// Parse the ligand.
			ligand lig(ligands);

			// Create grid maps on the fly if necessary.
			BOOST_ASSERT(atom_types_to_populate.empty());
			const vector<size_t> ligand_atom_types = lig.get_atom_types();
			for (const auto t : ligand_atom_types)
			{
				BOOST_ASSERT(t < XS_TYPE_SIZE);
				array3d<fl>& grid_map = grid_maps[t];
				if (grid_map.initialized()) continue; // The grid map of XScore atom type t has already been populated.
				grid_map.resize(b.num_probes); // An exception may be thrown in case memory is exhausted.
				atom_types_to_populate.push_back(t);  // The grid map of XScore atom type t has not been populated and should be populated now.
			}
			if (atom_types_to_populate.size())
			{
				for (size_t x = 0; x < num_gm_tasks; ++x)
				{
					tp.push_back(packaged_task<void()>(bind(grid_map_task, std::ref(grid_maps), cref(atom_types_to_populate), x, cref(sf), cref(b), cref(rec))));
				}
				tp.sync();
				atom_types_to_populate.clear();
			}

			// Run Monte Carlo tasks.
			for (size_t i = 0; i < phase1_num_mc_tasks; ++i)
			{
				BOOST_ASSERT(phase1_result_containers[i].empty());
				BOOST_ASSERT(phase1_result_containers[i].capacity() == 1);
				tp.push_back(packaged_task<void()>(bind(monte_carlo_task, std::ref(phase1_result_containers[i]), cref(lig), rng(), cref(alphas), cref(sf), cref(b), cref(grid_maps))));
			}
			tp.sync();

			// Merge results from all the tasks into one single result container.
			BOOST_ASSERT(phase1_results.empty());
			const fl required_square_error = static_cast<fl>(4 * lig.num_heavy_atoms); // Ligands with RMSD < 2.0 will be clustered into the same cluster.
			for (size_t i = 0; i < phase1_num_mc_tasks; ++i)
			{
				ptr_vector<result>& task_results = phase1_result_containers[i];
				BOOST_ASSERT(task_results.capacity() == 1);
				for (auto& task_result : task_results)
				{
					add_to_result_container(phase1_results, static_cast<result&&>(task_result), required_square_error);
				}
				task_results.clear();
			}

			// No conformation can be found if the search space is too small.
			if (phase1_results.size())
			{
				const result& r = phase1_results.front();

				// Rescore conformations with random forest.
				vector<float> v(41);
				for (size_t i = 0; i < lig.num_heavy_atoms; ++i)
				{
					const auto& la = lig.heavy_atoms[i];
					if (la.rf == RF_TYPE_SIZE) continue;
					for (const auto& ra : rec.atoms)
					{
						if (ra.rf == RF_TYPE_SIZE) continue;
						const auto dist_sqr = distance_sqr(r.heavy_atoms[i], ra.coordinate);
						if (dist_sqr >= 144) continue; // RF-Score cutoff 12A
						++v[(la.rf << 2) + ra.rf];
						if (dist_sqr >= 64) continue; // Vina score cutoff 8A
						if (la.xs != XS_TYPE_SIZE && ra.xs != XS_TYPE_SIZE)
						{
							sf.score(v.data() + 36, la.xs, ra.xs, dist_sqr);
						}
					}
				}
				const float rfscore = f(v);

				// Dump ligand summaries to the csv file.
				slice_csv << idx << ',' << lig_id << ',' << (r.f * lig.flexibility_penalty_factor) << ',' << (r.f * lig.num_heavy_atoms_inverse) << ',' << rfscore << ',' << mwt << ',' << lgp << ',' << ads << ',' << pds << ',' << hbd << ',' << hba << ',' << psa << ',' << chg << ',' << nrb << ',' << smiles << '\n';

				// Clear the results of the current ligand.
				phase1_results.clear();
			}

			// Report progress.
			conn.update(collection, BSON("_id" << _id), BSON("$inc" << BSON(slice_key << 1)));
		}
		slice_csv.close();

		// Increment the completed counter.
		conn.update(collection, BSON("_id" << _id << "$atomic" << 1), BSON("$inc" << BSON("completed" << 1)));

		// If phase 1 is done, transit to phase 2.
		if (!conn.query(collection, QUERY("_id" << _id << "completed" << 100))->more()) continue;
		cout << now() << "Executing job " << _id << " phase 2" << endl;

		// Combine and delete multiple slice csv's.
		ptr_vector<summary> phase1_summaries(num_ligands);
		for (size_t s = 0; s < 100; ++s)
		{
			// Parse slice csv.
			const auto slice_csv_path = job_path / (lexical_cast<string>(s) + ".csv");
			boost::filesystem::ifstream slice_csv(slice_csv_path);
			while (getline(slice_csv, line))
			{
				const auto comma1 = line.find(',', 1);
				const auto comma2 = comma1 + 9;
				const auto comma3 = line.find(',', comma2 + 6);
				const auto comma4 = line.find(',', comma3 + 6);
				const auto comma5 = line.find(',', comma4 + 6);
				BOOST_ASSERT(line[comma2] == ',');
				vector<fl> energies, efficiencies, rfscores;
				energies.push_back(lexical_cast<fl>(line.substr(comma2 + 1, comma3 - comma2 - 1)));
				efficiencies.push_back(lexical_cast<fl>(line.substr(comma3 + 1, comma4 - comma3 - 1)));
				rfscores.push_back(lexical_cast<fl>(line.substr(comma4 + 1, comma5 - comma4 - 1)));
				phase1_summaries.push_back(new summary(lexical_cast<size_t>(line.substr(0, comma1)), line.substr(comma1 + 1, 8), static_cast<vector<fl>&&>(energies), static_cast<vector<fl>&&>(efficiencies), static_cast<vector<fl>&&>(rfscores), vector<string>(), line.substr(comma5 + 1), string()));
			}
			slice_csv.close();
			remove(slice_csv_path);
		}
		const auto docked = phase1_summaries.size();
		BOOST_ASSERT(docked <= num_ligands);
		unsigned int num_hits = 1000;
		if (docked < 1000)
		{
			num_hits = docked;
			conn.update(collection, BSON("_id" << _id), BSON("$set" << BSON("hits" << num_hits)));
		}

		// Sort phase 1 summaries.
		phase1_summaries.sort();

		// Write phase 1 csv.
		{
			boost::filesystem::ofstream phase1_csv(job_path / "phase1.csv.gz");
			filtering_ostream phase1_csv_gz;
			phase1_csv_gz.push(gzip_compressor());
			phase1_csv_gz.push(phase1_csv);
			phase1_csv_gz.setf(ios::fixed, ios::floatfield);
			phase1_csv_gz << setprecision(3);
			phase1_csv_gz << "ZINC ID,Free energy (kcal/mol),Ligand efficiency (kcal/mol),RF-Score (pK),Consensus score (pK),Molecular weight (g/mol),Partition coefficient xlogP,Apolar desolvation (kcal/mol),Polar desolvation (kcal/mol),Hydrogen bond donors,Hydrogen bond acceptors,Polar surface area tPSA (A^2),Net charge,Rotatable bonds,SMILES\n";
			for (const auto& s : phase1_summaries)
			{
				BOOST_ASSERT(s.energies.size() == 1);
				BOOST_ASSERT(s.efficiencies.size() == 1);
				BOOST_ASSERT(s.rfscores.size() == 1);
				phase1_csv_gz << s.lig_id << ',' << s.energies.front() << ',' << s.efficiencies.front() << ',' << s.rfscores.front() << ',' << s.consensuses.front() << ',' << s.property << '\n';
			}
		}

		// Perform phase 2.
		const auto hits_pdbqt_path = job_path / "hits.pdbqt.gz";
		ptr_vector<summary> phase2_summaries(num_hits);
		for (auto idx = 0; idx < num_hits; ++idx)
		{
			// Locate a ligand.
			const auto& s = phase1_summaries[idx];
			headers.seekg(sizeof(size_t) * s.index);
			size_t header;
			headers.read((char*)&header, sizeof(size_t));
			ligands.seekg(header);

			// Get the remark lines.
			string property, smiles, supplier;
			getline(ligands, property); // REMARK     00000007  277.364     2.51        9   -14.93   0   4  39   0   8    
			getline(ligands, smiles);   // REMARK     CCN(CC)C(=O)COc1ccc(cc1OC)CC=C
			getline(ligands, supplier); // REMARK     8 | ChEMBL12 | ChEMBL13 | ChEMBL14 | ChEMBL15 | ChemDB | Enamine (Depleted) | PubChem | UORSY

			// Parse the ligand.
			ligand lig(ligands);

			// Create grid maps on the fly if necessary.
			BOOST_ASSERT(atom_types_to_populate.empty());
			const vector<size_t> ligand_atom_types = lig.get_atom_types();
			for (const auto t : ligand_atom_types)
			{
				BOOST_ASSERT(t < XS_TYPE_SIZE);
				array3d<fl>& grid_map = grid_maps[t];
				if (grid_map.initialized()) continue; // The grid map of XScore atom type t has already been populated.
				grid_map.resize(b.num_probes); // An exception may be thrown in case memory is exhausted.
				atom_types_to_populate.push_back(t);  // The grid map of XScore atom type t has not been populated and should be populated now.
			}
			if (atom_types_to_populate.size())
			{
				for (size_t x = 0; x < num_gm_tasks; ++x)
				{
					tp.push_back(packaged_task<void()>(bind(grid_map_task, std::ref(grid_maps), cref(atom_types_to_populate), x, cref(sf), cref(b), cref(rec))));
				}
				tp.sync();
				atom_types_to_populate.clear();
			}

			// Run Monte Carlo tasks.
			for (size_t i = 0; i < phase2_num_mc_tasks; ++i)
			{
				BOOST_ASSERT(phase2_result_containers[i].empty());
				tp.push_back(packaged_task<void()>(bind(monte_carlo_task, std::ref(phase2_result_containers[i]), cref(lig), rng(), cref(alphas), cref(sf), cref(b), cref(grid_maps))));
			}
			tp.sync();

			// Merge results from all the tasks into one single result container.
			BOOST_ASSERT(phase2_results.empty());
			const fl required_square_error = static_cast<fl>(4 * lig.num_heavy_atoms); // Ligands with RMSD < 2.0 will be clustered into the same cluster.
			for (size_t i = 0; i < phase2_num_mc_tasks; ++i)
			{
				ptr_vector<result>& task_results = phase2_result_containers[i];
				for (auto& task_result : task_results)
				{
					add_to_result_container(phase2_results, static_cast<result&&>(task_result), required_square_error);
				}
				task_results.clear();
			}

			const size_t num_results = min<size_t>(phase2_results.size(), max_conformations);
			if (num_results)
			{
				// Adjust free energy relative to flexibility, and calculate ligand efficiency.
				result& best_result = phase2_results.front();
				const fl best_result_intra_e = best_result.e - best_result.f;
				for (size_t i = 0; i < num_results; ++i)
				{
					auto& r = phase2_results[i];
					r.e_nd = (r.e - best_result_intra_e) * lig.flexibility_penalty_factor;
					r.efficiency = r.f * lig.num_heavy_atoms_inverse;
				}

				// Determine the number of conformations to output according to user-supplied max_conformations and energy_range.
				const fl energy_upper_bound = best_result.e_nd + energy_range;
				size_t num_conformations;
				for (num_conformations = 1; (num_conformations < num_results) && (phase2_results[num_conformations].e_nd <= energy_upper_bound); ++num_conformations);

				const size_t num_lig_hbda = lig.hbda.size();
				for (size_t k = 0; k < num_conformations; ++k)
				{
					result& r = phase2_results[k];

					// Find the number of hydrogen bonds.
					BOOST_ASSERT(r.hbonds.empty());
					size_t num_hbonds = 0;
					for (size_t i = 0; i < num_lig_hbda; ++i)
					{
						const atom& lig_atom = lig.heavy_atoms[lig.hbda[i]];
						BOOST_ASSERT(xs_is_donor_acceptor(lig_atom.xs));

						// Find the possibly interacting receptor atoms via partitions.
						const vec3 lig_coords = r.heavy_atoms[lig.hbda[i]];
						const vector<size_t>& rec_hbda = rec.hbda_3d(b.partition_index(lig_coords));

						// Accumulate individual free energies for each atom types to populate.
						const size_t num_rec_hbda = rec_hbda.size();
						for (size_t l = 0; l < num_rec_hbda; ++l)
						{
							const atom& rec_atom = rec.atoms[rec_hbda[l]];
							BOOST_ASSERT(xs_is_donor_acceptor(rec_atom.xs));
							if (!xs_hbond(lig_atom.xs, rec_atom.xs)) continue;
							const fl r2 = distance_sqr(lig_coords, rec_atom.coordinate);
							if (r2 <= hbond_dist_sqr)
							{
								++num_hbonds;
								r.hbonds += " | " + rec_atom.name + " - " + lig_atom.name;
							}
						}
					}
					r.hbonds = lexical_cast<string>(num_hbonds) + r.hbonds;

					// Rescore conformations with random forest.
					vector<float> v(41);
					for (size_t i = 0; i < lig.num_heavy_atoms; ++i)
					{
						const auto& la = lig.heavy_atoms[i];
						if (la.rf == RF_TYPE_SIZE) continue;
						for (const auto& ra : rec.atoms)
						{
							if (ra.rf == RF_TYPE_SIZE) continue;
							const auto dist_sqr = distance_sqr(r.heavy_atoms[i], ra.coordinate);
							if (dist_sqr >= 144) continue; // RF-Score cutoff 12A
							++v[(la.rf << 2) + ra.rf];
							if (dist_sqr >= 64) continue; // Vina score cutoff 8A
							if (la.xs != XS_TYPE_SIZE && ra.xs != XS_TYPE_SIZE)
							{
								sf.score(v.data() + 36, la.xs, ra.xs, dist_sqr);
							}
						}
					}
					r.rfscore = f(v);
					r.consensus = (r.rfscore + energy2pK * r.e_nd) * 0.5;
				}

				// Write models to file.
				lig.write_models(hits_pdbqt_path, property, smiles, supplier, phase2_results, num_conformations, b, grid_maps);

				// Add to summaries.
				vector<fl> energies(num_conformations), efficiencies(num_conformations), rfscores(num_conformations);
				vector<string> hbonds(num_conformations);
				for (size_t k = 0; k < num_conformations; ++k)
				{
					const auto& r = phase2_results[k];
					energies[k] = r.e_nd;
					efficiencies[k] = r.efficiency;
					hbonds[k] = r.hbonds;
					rfscores[k] = r.rfscore;
				}
				phase2_summaries.push_back(new summary(s.index, s.lig_id, static_cast<vector<fl>&&>(energies), static_cast<vector<fl>&&>(efficiencies), static_cast<vector<fl>&&>(rfscores), static_cast<vector<string>&&>(hbonds), string(s.property), supplier.substr(11)));

				// Clear the results of the current ligand.
				phase2_results.clear();
			}

			// Report progress every ligand.
			conn.update(collection, BSON("_id" << _id), BSON("$inc" << BSON("refined" << 1)));
		}

		// Sort phase 2 summaries.
		phase2_summaries.sort();

		// Write phase 2 csv.
		{
			boost::filesystem::ofstream phase2_csv(job_path / "phase2.csv.gz");
			filtering_ostream phase2_csv_gz;
			phase2_csv_gz.push(gzip_compressor());
			phase2_csv_gz.push(phase2_csv);
			phase2_csv_gz.setf(ios::fixed, ios::floatfield);
			phase2_csv_gz << setprecision(3);
			phase2_csv_gz << "ZINC ID,Conformations";
			for (size_t i = 1; i <= max_conformations; ++i) phase2_csv_gz << ",Conformation " << i << " free energy (kcal/mol),Conformation " << i << " ligand efficiency (kcal/mol),Conformation " << i << " RF-Score (pK),Conformation " << i << " consensus score (pK),Conformation " << i << " hydrogen bonds";
			phase2_csv_gz << ",Molecular weight (g/mol),Partition coefficient xlogP,Apolar desolvation (kcal/mol),Polar desolvation (kcal/mol),Hydrogen bond donors,Hydrogen bond acceptors,Polar surface area tPSA (A^2),Net charge,Rotatable bonds,SMILES,Substance information,Suppliers\n";
			for (const auto& s : phase2_summaries)
			{
				const size_t num_conformations = s.energies.size();
				phase2_csv_gz << s.lig_id << ',' << num_conformations;
				for (size_t j = 0; j < num_conformations; ++j)
				{
					phase2_csv_gz << ',' << s.energies[j] << ',' << s.efficiencies[j] << ',' << s.rfscores[j] << ',' << s.consensuses[j] << ',' << s.hbonds[j];
				}
				for (size_t j = num_conformations; j < max_conformations; ++j)
				{
					phase2_csv_gz << ",,,,,";
				}
				phase2_csv_gz << ',' << s.property << ",http://zinc.docking.org/substance/" << s.lig_id << ',' << s.supplier << '\n';
			}
		}

		// Set done time.
		const auto millis_since_epoch = duration_cast<chrono::milliseconds>(system_clock::now().time_since_epoch()).count();
		conn.update(collection, BSON("_id" << _id), BSON("$set" << BSON("done" << Date_t(millis_since_epoch))));

		// Send completion notification email.
		const auto compt_cursor = conn.query(collection, QUERY("_id" << _id), 1, 0, &compt_fields);
		const auto compt = compt_cursor->next();
		const auto email = compt["email"].String();
		cout << now() << "Sending a completion notification email to " << email << endl;
		MailMessage message;
		message.setSender("idock <noreply@cse.cuhk.edu.hk>");
		message.setSubject("Your idock job has completed");
		message.setContent("Your idock job submitted on " + to_simple_string(ptime(epoch, boost::posix_time::milliseconds(compt["submitted"].Date().millis))) + " UTC docking " + lexical_cast<string>(num_ligands) + " ligands with description as \"" + compt["description"].String() + "\" was done on " + to_simple_string(ptime(epoch, boost::posix_time::milliseconds(millis_since_epoch))) + " UTC. " + lexical_cast<string>(docked) + " ligands were docked and " + lexical_cast<string>(num_hits) + " hits were refined. View result at http://istar.cse.cuhk.edu.hk/idock/iview?" + _id.str());
		message.addRecipient(MailRecipient(MailRecipient::PRIMARY_RECIPIENT, email));
		SMTPClientSession session("137.189.91.190");
		session.login();
		session.sendMessage(message);
		session.close();
	}
}
