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
	const size_t num_mc_tasks = 32;
	const fl grid_granularity = 0.08;
	const auto epoch = boost::gregorian::date(1970, 1, 1);

	// Calculate the slice split points on the fly.
	const size_t total_ligands = 17224424;
	const size_t num_slices = 10;
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
	vector<size_t> atom_types_to_populate; atom_types_to_populate.reserve(XS_TYPE_SIZE);
	ptr_vector<ptr_vector<result>> result_containers;
	result_containers.resize(num_mc_tasks);
	for (auto& rc : result_containers) rc.reserve(1);
	ptr_vector<result> results(1);

	// Open files for reading.
	boost::filesystem::ifstream headers(headers_path);
	boost::filesystem::ifstream ligands(ligands_path);

	while (true)
	{
		// Fetch a job in a first-come-first-served manner.
		BSONObj info;
		conn.runCommand("istar", BSON("findandmodify" << "idock" << "query" << BSON("scheduled" << BSON("$lt" << static_cast<unsigned int>(num_slices))) << "sort" << BSON("submitted" << 1) << "update" << BSON("$inc" << BSON("scheduled" << 1)) << "fields" << jobid_fields), info);
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
			const auto param = conn.query(collection, QUERY("_id" << _id), 1, 0, &param_fields)->next();
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
		cout << now() << "Executing job " << _id << " slice " << slice << endl;
		const auto slice_key = lexical_cast<string>(slice);
		const auto beg_lig = slices[slice];
		const auto end_lig = slices[slice + 1];
		headers.seekg(sizeof(size_t) * beg_lig);
		boost::filesystem::ofstream slice_csv(job_path / (slice_key + ".csv"));
		slice_csv.setf(ios::fixed, ios::floatfield);
		slice_csv << setprecision(12); // Dump as many digits as possible in order to recover accurate conformations in summaries.
		for (auto idx = beg_lig; idx < end_lig; ++idx)
		{
			// Locate a ligand.
			size_t header;
			headers.read((char*)&header, sizeof(size_t));
			ligands.seekg(header);

			// Check if the ligand satisfies the filtering conditions.
			string property;
			getline(ligands, property); // REMARK     00000007  277.364     2.51        9   -14.93   0   4  39   0   8    
			const auto mwt = right_cast<fl>(property, 21, 28);
			const auto lgp = right_cast<fl>(property, 30, 37);
			const auto ads = right_cast<fl>(property, 39, 46);
			const auto pds = right_cast<fl>(property, 48, 55);
			const auto hbd = right_cast<int>(property, 57, 59);
			const auto hba = right_cast<int>(property, 61, 63);
			const auto psa = right_cast<int>(property, 65, 67);
			const auto chg = right_cast<int>(property, 69, 71);
			const auto nrb = right_cast<int>(property, 73, 75);
			if (!((mwt_lb <= mwt) && (mwt <= mwt_ub) && (lgp_lb <= lgp) && (lgp <= lgp_ub) && (ads_lb <= ads) && (ads <= ads_ub) && (pds_lb <= pds) && (pds <= pds_ub) && (hbd_lb <= hbd) && (hbd <= hbd_ub) && (hba_lb <= hba) && (hba <= hba_ub) && (psa_lb <= psa) && (psa <= psa_ub) && (chg_lb <= chg) && (chg <= chg_ub) && (nrb_lb <= nrb) && (nrb <= nrb_ub))) continue;

			// Obtain ligand ID. ZINC IDs are 8-character long.
			const auto lig_id = property.substr(11, 8);

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

			// Run Monte Carlo tasks in parallel.
			for (size_t i = 0; i < num_mc_tasks; ++i)
			{
				BOOST_ASSERT(result_containers[i].empty());
				BOOST_ASSERT(result_containers[i].capacity() == 1);
				tp.push_back(packaged_task<void()>(bind(monte_carlo_task, std::ref(result_containers[i]), cref(lig), rng(), cref(alphas), cref(sf), cref(b), cref(grid_maps))));
			}
			tp.sync();

			// Merge results from all the tasks into one single result container.
			BOOST_ASSERT(results.empty());
			BOOST_ASSERT(results.capacity() == 1);
			const fl required_square_error = static_cast<fl>(4 * lig.num_heavy_atoms); // Ligands with RMSD < 2.0 will be clustered into the same cluster.
			for (size_t i = 0; i < num_mc_tasks; ++i)
			{
				ptr_vector<result>& task_results = result_containers[i];
				BOOST_ASSERT(task_results.capacity() == 1);
				for (auto& task_result : task_results)
				{
					add_to_result_container(results, static_cast<result&&>(task_result), required_square_error);
				}
				task_results.clear();
			}

			// No conformation can be found if the search space is too small.
			if (results.size())
			{
				BOOST_ASSERT(results.size() == 1);
				const result& r = results.front();

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
				const auto rfscore = f(v);

				// Find hydrogen bonds.
				const size_t num_lig_hbda = lig.hbda.size();
				string hbonds;
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
							hbonds += " | " + rec_atom.name + " - " + lig_atom.name;
						}
					}
				}
				hbonds = lexical_cast<string>(num_hbonds) + hbonds;

				// Dump ligand result to the slice csv file.
				slice_csv << idx << ',' << (r.f * lig.flexibility_penalty_factor) << ',' << (r.f * lig.num_heavy_atoms_inverse) << ',' << rfscore << ',' << hbonds;
				const auto& p = r.conf.position;
				const auto& q = r.conf.orientation;
				slice_csv << ',' << p[0] << ',' << p[1] << ',' << p[2] << ',' << q.a << ',' << q.b << ',' << q.c << ',' << q.d;
				for (const auto t : r.conf.torsions)
				{
					slice_csv << ',' << t;
				}
				slice_csv << '\n';

				// Clear the results of the current ligand.
				results.clear();
			}

			// Report progress.
			conn.update(collection, BSON("_id" << _id), BSON("$inc" << BSON(slice_key << 1)));
		}
		slice_csv.close();

		// Increment the completed counter.
		conn.update(collection, BSON("_id" << _id << "$atomic" << 1), BSON("$inc" << BSON("completed" << 1)));

		// If the number of completed slices is not equal to the number of total slices, loop again to fetch another slice.
		if (!conn.query(collection, QUERY("_id" << _id << "completed" << static_cast<unsigned int>(num_slices)))->more()) continue;

		// Combine and delete multiple slice csv's.
		cout << now() << "Executing job " << _id << " phase 2" << endl;
		ptr_vector<summary> summaries(num_ligands);
		for (size_t s = 0; s < num_slices; ++s)
		{
			// Parse slice csv.
			const auto slice_csv_path = job_path / (lexical_cast<string>(s) + ".csv");
			string line;
			for (boost::filesystem::ifstream slice_csv(slice_csv_path); getline(slice_csv, line);)
			{
				vector<string> tokens;
				tokens.reserve(12);
				for (size_t comma0 = 0; true;)
				{
					const size_t comma1 = line.find(',', comma0 + 1);
					if (comma1 == string::npos)
					{
						tokens.push_back(line.substr(comma0));
						break;
					}
					tokens.push_back(line.substr(comma0, comma1 - comma0));
					comma0 = comma1 + 1;
				}
				BOOST_ASSERT(tokens.size() >= 12);
				conformation conf(tokens.size() - 12);
				conf.position = vec3(lexical_cast<fl>(tokens[5]), lexical_cast<fl>(tokens[6]), lexical_cast<fl>(tokens[7]));
				conf.orientation = qtn4(lexical_cast<fl>(tokens[8]), lexical_cast<fl>(tokens[9]), lexical_cast<fl>(tokens[10]), lexical_cast<fl>(tokens[11]));
				for (size_t i = 0; i < conf.torsions.size(); ++i)
				{
					conf.torsions[i] = lexical_cast<fl>(tokens[12 + i]);
				}
				summaries.push_back(new summary(lexical_cast<size_t>(tokens[0]), lexical_cast<fl>(tokens[1]), lexical_cast<fl>(tokens[2]), lexical_cast<fl>(tokens[3]), static_cast<string&&>(tokens[4]), conf));
			}
			remove(slice_csv_path);
		}

		// Sort summaries.
		summaries.sort();
		const auto num_summaries = summaries.size();
		BOOST_ASSERT(num_summaries <= num_ligands);
		const auto num_hits = min<size_t>(num_summaries, 1000);
		BOOST_ASSERT(num_hits <= num_ligands);

		// Perform phase 2.
		{
			boost::filesystem::ofstream log_csv(job_path / "log.csv.gz");
			boost::filesystem::ofstream ligands_pdbqt(job_path / "ligands.pdbqt.gz");
			filtering_ostream log_csv_gz;
			filtering_ostream ligands_pdbqt_gz;
			log_csv_gz.push(gzip_compressor());
			ligands_pdbqt_gz.push(gzip_compressor());
			log_csv_gz.push(log_csv);
			ligands_pdbqt_gz.push(ligands_pdbqt);
			log_csv_gz.setf(ios::fixed, ios::floatfield);
			ligands_pdbqt_gz.setf(ios::fixed, ios::floatfield);
			log_csv_gz << "ZINC ID,Free energy (kcal/mol),Ligand efficiency (kcal/mol),RF-Score (pK),Consensus score (pK),Hydrogen bonds,Molecular weight (g/mol),Partition coefficient xlogP,Apolar desolvation (kcal/mol),Polar desolvation (kcal/mol),Hydrogen bond donors,Hydrogen bond acceptors,Polar surface area tPSA (A^2),Net charge,Rotatable bonds,SMILES,Substance information,Suppliers\n" << setprecision(3);
			ligands_pdbqt_gz << setprecision(3);
			for (auto idx = 0; idx < num_summaries; ++idx)
			{
				// Locate a ligand.
				const auto& s = summaries[idx];
				headers.seekg(sizeof(size_t) * s.index);
				size_t header;
				headers.read((char*)&header, sizeof(size_t));
				ligands.seekg(header);

				// Parse the REMARK lines.
				string property, smiles, supplier;
				getline(ligands, property); // REMARK     00000007  277.364     2.51        9   -14.93   0   4  39   0   8    
				getline(ligands, smiles);   // REMARK     CCN(CC)C(=O)COc1ccc(cc1OC)CC=C
				getline(ligands, supplier); // REMARK     8 | ChEMBL12 | ChEMBL13 | ChEMBL14 | ChEMBL15 | ChemDB | Enamine (Depleted) | PubChem | UORSY
				const auto lig_id = property.substr(11, 8);
				const auto mwt = right_cast<fl>(property, 21, 28);
				const auto lgp = right_cast<fl>(property, 30, 37);
				const auto ads = right_cast<fl>(property, 39, 46);
				const auto pds = right_cast<fl>(property, 48, 55);
				const auto hbd = right_cast<int>(property, 57, 59);
				const auto hba = right_cast<int>(property, 61, 63);
				const auto psa = right_cast<int>(property, 65, 67);
				const auto chg = right_cast<int>(property, 69, 71);
				const auto nrb = right_cast<int>(property, 73, 75);

				// Write to summary.csv.
				log_csv_gz << lig_id << ',' << s.energy << ',' << s.efficiency << ',' << s.rfscore << ',' << s.consensus() << ',' << s.hbonds << ',' << mwt << ',' << lgp << ',' << ads << ',' << pds << ',' << hbd << ',' << hba << ',' << psa << ',' << chg << ',' << nrb << ',' << smiles.substr(11) << ",http://zinc.docking.org/substance/" << lig_id << ',' << supplier.substr(11) << '\n';

				if (idx >= num_hits) continue;

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

				// Apply conformation.
				fl e, f;
				change g(lig.num_active_torsions);
				lig.evaluate(s.conf, sf, b, grid_maps, -99, e, f, g);
				const auto r = lig.compose_result(e, f, s.conf);

				// Write models to file.
				lig.write_model(ligands_pdbqt_gz, property, smiles, supplier, s, r, b, grid_maps);
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
		message.setContent("Your idock job submitted on " + to_simple_string(ptime(epoch, boost::posix_time::milliseconds(compt["submitted"].Date().millis))) + " UTC docking " + lexical_cast<string>(num_ligands) + " ligands with description as \"" + compt["description"].String() + "\" was done on " + to_simple_string(ptime(epoch, boost::posix_time::milliseconds(millis_since_epoch))) + " UTC. " + lexical_cast<string>(num_summaries) + " ligands were successfully docked and the top " + lexical_cast<string>(num_hits) + " ligands were written to output. View result at http://istar.cse.cuhk.edu.hk/idock/iview/?" + _id.str());
		message.addRecipient(MailRecipient(MailRecipient::PRIMARY_RECIPIENT, email));
		SMTPClientSession session("137.189.91.190");
		session.login();
		session.sendMessage(message);
		session.close();
	}
}
