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

#include <boost/thread/thread.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/fstream.hpp>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#include <boost/process/operations.hpp>
#include <boost/date_time/posix_time/posix_time_types.hpp>
#include <mongo/client/dbclient.h>
#include <Poco/Net/MailMessage.h>
#include <Poco/Net/MailRecipient.h>
#include <Poco/Net/SMTPClientSession.h>
#include "receptor.hpp"
#include "ligand.hpp"
#include "thread_pool.hpp"
#include "grid_map_task.hpp"
#include "monte_carlo_task.hpp"
#include "summary.hpp"

int main(int argc, char* argv[])
{
	using std::cout;
	using std::string;
	using boost::array;
	using boost::thread;
	using boost::filesystem::path;
	using boost::filesystem::ifstream;
	using boost::filesystem::ofstream;
	using namespace idock;

	// Fetch command line arguments.
	const auto host = argv[1];
	const auto user = argv[2];
	const auto pwd = argv[3];
	const path jobs_path = argv[4];

	using namespace mongo;
	DBClientConnection conn;
	{
		// Connect to host and authenticate user.
		cout << "Connecting to " << host << " and authenticating " << user << '\n';
		string errmsg;
		if ((!conn.connect(host, errmsg)) || (!conn.auth("istar", user, pwd, errmsg)))
		{
			cout << errmsg << '\n';
			return 1;
		}
	}

	// Initialize default values of constant arguments.
	const auto collection = "istar.idock";
	const auto jobid_fields = BSON("_id" << 1 << "scheduled" << 1);
	const auto param_fields = BSON("_id" << 0 << "receptor" << 1 << "ligands" << 1 << "center_x" << 1 << "center_y" << 1 << "center_z" << 1 << "size_x" << 1 << "size_y" << 1 << "size_z" << 1 << "mwt_lb" << 1 << "mwt_ub" << 1 << "logp_lb" << 1 << "logp_ub" << 1 << "ad_lb" << 1 << "ad_ub" << 1 << "pd_lb" << 1 << "pd_ub" << 1 << "hbd_lb" << 1 << "hbd_ub" << 1 << "hba_lb" << 1 << "hba_ub" << 1 << "tpsa_lb" << 1 << "tpsa_ub" << 1 << "charge_lb" << 1 << "charge_ub" << 1 << "nrb_lb" << 1 << "nrb_ub" << 1);
	const auto compt_fields = BSON("_id" << 0 << "sort" << 1 << "email" << 1 << "submitted" << 1 << "description" << 1);
	const path ligands_path = "16_lig.pdbqt";
	const path headers_path = "16_hdr.bin";
	const size_t num_threads = thread::hardware_concurrency();
	const size_t seed = time(0);
	const size_t phase1_num_mc_tasks = 32;
	const size_t phase2_num_mc_tasks = 128;
	const size_t max_conformations = 20;
	const size_t max_results = 20; // Maximum number of results obtained from a single Monte Carlo task.
	const size_t slices[101] = { 0, 121712, 243424, 365136, 486848, 608560, 730272, 851984, 973696, 1095408, 1217120, 1338832, 1460544, 1582256, 1703968, 1825680, 1947392, 2069104, 2190816, 2312528, 2434240, 2555952, 2677664, 2799376, 2921088, 3042800, 3164512, 3286224, 3407936, 3529648, 3651360, 3773072, 3894784, 4016496, 4138208, 4259920, 4381632, 4503344, 4625056, 4746768, 4868480, 4990192, 5111904, 5233616, 5355328, 5477040, 5598752, 5720464, 5842176, 5963888, 6085600, 6207312, 6329024, 6450736, 6572448, 6694160, 6815872, 6937584, 7059296, 7181008, 7302720, 7424432, 7546144, 7667856, 7789568, 7911280, 8032992, 8154704, 8276416, 8398128, 8519840, 8641552, 8763264, 8884976, 9006688, 9128400, 9250112, 9371824, 9493536, 9615248, 9736960, 9858672, 9980384, 10102096, 10223808, 10345520, 10467232, 10588944, 10710655, 10832366, 10954077, 11075788, 11197499, 11319210, 11440921, 11562632, 11684343, 11806054, 11927765, 12049476, 12171187 };
	const fl energy_range = 3.0;
	const fl grid_granularity = 0.08;
	const auto rscript = boost::process::find_executable_in_path("Rscript");
	const auto sort_summaries_by_idockscore = [] (const summary& s1, const summary& s2) -> bool { return s1.energies.front() < s2.energies.front(); };
	const auto sort_summaries_by_rfscore = [] (const summary& s1, const summary& s2) -> bool { return s1.rfscores.front() > s2.rfscores.front(); };
	const auto sort_summaries_by_consensus = [] (const summary& s1, const summary& s2) -> bool { return s1.consensuses.front() > s2.consensuses.front(); };
	const auto sort_results_by_rfscore = [] (const result& r1, const result& r2) -> bool { return r1.rfscore > r2.rfscore; };
	const auto sort_results_by_consensus = [] (const result& r1, const result& r2) -> bool { return r1.consensus > r2.consensus; };
	const auto epoch = boost::gregorian::date(1970, 1, 1);

	// Initialize variables for job caching.
	OID _id;
	path job_path;
	double mwt_lb, mwt_ub, logp_lb, logp_ub, ad_lb, ad_ub, pd_lb, pd_ub;
	int num_ligands, hbd_lb, hbd_ub, hba_lb, hba_ub, tpsa_lb, tpsa_ub, charge_lb, charge_ub, nrb_lb, nrb_ub;
	box b;
	receptor rec;
	size_t num_gm_tasks;
	ptr_vector<packaged_task<void>> gm_tasks;
	vector<array3d<fl>> grid_maps(XS_TYPE_SIZE);

	// Initialize a Mersenne Twister random number generator.
	mt19937eng eng(seed);

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
		const size_t num_sf_tasks = ((XS_TYPE_SIZE + 1) * XS_TYPE_SIZE) >> 1;
		ptr_vector<packaged_task<void>> sf_tasks(num_sf_tasks);
		for (size_t t1 =  0; t1 < XS_TYPE_SIZE; ++t1)
		for (size_t t2 = t1; t2 < XS_TYPE_SIZE; ++t2)
		{
			sf_tasks.push_back(new packaged_task<void>(bind<void>(&scoring_function::precalculate, boost::ref(sf), t1, t2, boost::cref(rs))));
		}
		BOOST_ASSERT(sf_tasks.size() == num_sf_tasks);

		// Run the scoring function tasks in parallel asynchronously.
		tp.run(sf_tasks);

		// Wait until all the scoring function tasks are completed.
		tp.sync();
	}

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
	ptr_vector<packaged_task<void>> mc_tasks(phase2_num_mc_tasks);
	ptr_vector<ptr_vector<result>> phase1_result_containers, phase2_result_containers;
	phase1_result_containers.resize(phase1_num_mc_tasks);
	phase2_result_containers.resize(phase2_num_mc_tasks);
	for (auto& rc : phase1_result_containers) rc.reserve(1);
	for (auto& rc : phase2_result_containers) rc.reserve(max_results);
	ptr_vector<result> phase1_results(1), phase2_results(max_results * phase2_num_mc_tasks);

	// Open files for reading.
	ifstream headers(headers_path);
	ifstream ligands(ligands_path);

	while (true)
	{
		// Fetch a job in a FCFS manner.
		using namespace bson;
		BSONObj info;
		conn.runCommand("istar", BSON("findandmodify" << "idock" << "query" << BSON("scheduled" << BSON("$lt" << 100)) << "sort" << BSON("submitted" << 1) << "update" << BSON("$inc" << BSON("scheduled" << 1)) << "fields" << jobid_fields), info);
		const auto value = info["value"];
		if (value.isNull())
		{
			// Sleep for a while.
			using boost::this_thread::sleep_for;
			using boost::chrono::seconds;
			sleep_for(seconds(10));
			continue;
		}
		const auto job = value.Obj();

		// Refresh cache if it is a new job.
		if (_id != job["_id"].OID())
		{
			_id = job["_id"].OID();
			job_path = jobs_path / _id.str();
			if (!exists(job_path)) create_directory(job_path);

			auto param_cursor = conn.query(collection, QUERY("_id" << _id), 1, 0, &param_fields);
			const auto param = param_cursor->next();
			b = box(vec3(param["center_x"].Number(), param["center_y"].Number(), param["center_z"].Number()), vec3(param["size_x"].Int(), param["size_y"].Int(), param["size_z"].Int()), grid_granularity);
			rec = receptor(param["receptor"].String(), b);

			num_ligands = param["ligands"].Int();
			mwt_lb = param["mwt_lb"].Number();
			mwt_ub = param["mwt_ub"].Number();
			logp_lb = param["logp_lb"].Number();
			logp_ub = param["logp_ub"].Number();
			ad_lb = param["ad_lb"].Number();
			ad_ub = param["ad_ub"].Number();
			pd_lb = param["pd_lb"].Number();
			pd_ub = param["pd_ub"].Number();
			hbd_lb = param["hbd_lb"].Int();
			hbd_ub = param["hbd_ub"].Int();
			hba_lb = param["hba_lb"].Int();
			hba_ub = param["hba_ub"].Int();
			tpsa_lb = param["tpsa_lb"].Int();
			tpsa_ub = param["tpsa_ub"].Int();
			charge_lb = param["charge_lb"].Int();
			charge_ub = param["charge_ub"].Int();
			nrb_lb = param["nrb_lb"].Int();
			nrb_ub = param["nrb_ub"].Int();

			// Reserve storage for grid map task container.
			num_gm_tasks = b.num_probes[0];
			gm_tasks.reserve(num_gm_tasks);

			// Clear grid maps.
			grid_maps.clear();
			grid_maps.resize(XS_TYPE_SIZE);
		}
		const auto slice = job["scheduled"].Int();

		// Perform phase 1.
		cout << "Executing job " << _id << " phase 1 slice " << slice << '\n';
		const auto slice_key = lexical_cast<string>(slice);
		const auto start_lig = slices[slice];
		const auto end_lig = slices[slice + 1];

		ofstream slice_csv(job_path / (slice_key + ".csv"));
		slice_csv.setf(std::ios::fixed, std::ios::floatfield);
		slice_csv << std::setprecision(3);
		const auto slicef_csv_path = job_path / (slice_key + "F.csv");
		ofstream slicef_csv(slicef_csv_path);
		slicef_csv << "6.6,7.6,8.6,16.6,6.7,7.7,8.7,16.7,6.8,7.8,8.8,16.8,6.16,7.16,8.16,16.16,6.15,7.15,8.15,16.15,6.9,7.9,8.9,16.9,6.17,7.17,8.17,16.17,6.35,7.35,8.35,16.35,6.53,7.53,8.53,16.53\n";
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
			const auto logp = right_cast<fl>(line, 30, 37);
			const auto ad = right_cast<fl>(line, 39, 46);
			const auto pd = right_cast<fl>(line, 48, 55);
			const auto hbd = right_cast<int>(line, 57, 59);
			const auto hba = right_cast<int>(line, 61, 63);
			const auto tpsa = right_cast<int>(line, 65, 67);
			const auto charge = right_cast<int>(line, 69, 71);
			const auto nrb = right_cast<int>(line, 73, 75);
			if (!((mwt_lb <= mwt) && (mwt <= mwt_ub) && (logp_lb <= logp) && (logp <= logp_ub) && (ad_lb <= ad) && (ad <= ad_ub) && (pd_lb <= pd) && (pd <= pd_ub) && (hbd_lb <= hbd) && (hbd <= hbd_ub) && (hba_lb <= hba) && (hba <= hba_ub) && (tpsa_lb <= tpsa) && (tpsa <= tpsa_ub) && (charge_lb <= charge) && (charge <= charge_ub) && (nrb_lb <= nrb) && (nrb <= nrb_ub))) continue;

			// Obtain ligand ID. ZINC IDs are 8-character long.
			const auto lig_id = line.substr(11, 8);

			/// Filter out supplier line.
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
				BOOST_ASSERT(gm_tasks.empty());
				for (size_t x = 0; x < num_gm_tasks; ++x)
				{
					gm_tasks.push_back(new packaged_task<void>(bind<void>(grid_map_task, boost::ref(grid_maps), boost::cref(atom_types_to_populate), x, boost::cref(sf), boost::cref(b), boost::cref(rec))));
				}
				tp.run(gm_tasks);
				for (auto& t : gm_tasks)
				{
					t.get_future().get();
				}
				tp.sync();
				gm_tasks.clear();
				atom_types_to_populate.clear();
			}

			// Run Monte Carlo tasks.
			BOOST_ASSERT(mc_tasks.empty());
			for (size_t i = 0; i < phase1_num_mc_tasks; ++i)
			{
				BOOST_ASSERT(phase1_result_containers[i].empty());
				BOOST_ASSERT(phase1_result_containers[i].capacity() == 1);
				mc_tasks.push_back(new packaged_task<void>(bind<void>(monte_carlo_task, boost::ref(phase1_result_containers[i]), boost::cref(lig), eng(), boost::cref(alphas), boost::cref(sf), boost::cref(b), boost::cref(grid_maps))));
			}
			tp.run(mc_tasks);

			// Merge results from all the tasks into one single result container.
			BOOST_ASSERT(phase1_results.empty());
			const fl required_square_error = static_cast<fl>(4 * lig.num_heavy_atoms); // Ligands with RMSD < 2.0 will be clustered into the same cluster.
			for (size_t i = 0; i < phase1_num_mc_tasks; ++i)
			{
				mc_tasks[i].get_future().get();
				ptr_vector<result>& task_results = phase1_result_containers[i];
				BOOST_ASSERT(task_results.capacity() == 1);
				for (auto& task_result : task_results)
				{
					add_to_result_container(phase1_results, static_cast<result&&>(task_result), required_square_error);
				}
				task_results.clear();
			}

			// Block until all the Monte Carlo tasks are completed.
			tp.sync();
			mc_tasks.clear();

			// No conformation can be found if the search space is too small.
			if (phase1_results.size())
			{
				const result& r = phase1_results.front();

				// Dump ligand summaries to the csv file.
				slice_csv << idx << ',' << lig_id << ',' << (r.f * lig.flexibility_penalty_factor) << ',' << (r.f * lig.num_heavy_atoms_inverse) << ',' << mwt << ',' << logp << ',' << ad << ',' << pd << ',' << hbd << ',' << hba << ',' << tpsa << ',' << charge << ',' << nrb << '\n';

				// Dump the 36 RF-Score features.
				vector<size_t> features(RF_TYPE_SIZE << 2);
				for (size_t i = 0; i < lig.num_heavy_atoms; ++i)
				{
					if (lig.heavy_atoms[i].rf == RF_TYPE_SIZE) continue;
					for (const auto& a : rec.atoms)
					{
						if (a.rf == RF_TYPE_SIZE) continue;
						const auto dist_sqr = distance_sqr(r.heavy_atoms[i], a.coordinate);
						if (dist_sqr >= 144) continue;
						++features[(lig.heavy_atoms[i].rf << 2) + a.rf];
					}
				}
				slicef_csv << features[0];
				for (size_t i = 1; i < features.size(); ++i)
				{
					slicef_csv << ',' << features[i];
				}
				slicef_csv << '\n';

				// Clear the results of the current ligand.
				phase1_results.clear();
			}

			// Report progress.
			conn.update(collection, BSON("_id" << _id), BSON("$inc" << BSON(slice_key << 1)));
		}
		slice_csv.close();
		slicef_csv.close();

		// Call Rscript RF-Score.r
		const auto slicek_csv_path = job_path / (slice_key + "K.csv");
		create_child(rscript, vector<string> {"RF-Score.r", slicef_csv_path.string(), slicek_csv_path.string()}, boost::process::context()).wait();
		remove(slicef_csv_path);

		// Increment the completed counter.
		conn.update(collection, BSON("_id" << _id << "$atomic" << 1), BSON("$inc" << BSON("completed" << 1)));

		// If phase 1 is done, transit to phase 2.
		if (!conn.query(collection, QUERY("_id" << _id << "completed" << 100))->more()) continue;
		cout << "Executing job " << _id << " phase 2\n";

		// Combine and delete multiple slice csv's.
		ptr_vector<summary> phase1_summaries(num_ligands);
		for (size_t s = 0; s < 100; ++s)
		{
			// Parse slice csv.
			const auto slice_csv_path = job_path / (lexical_cast<string>(s) + ".csv");
			const auto slicek_csv_path = job_path / (lexical_cast<string>(s) + "K.csv");
			ifstream slice_csv(slice_csv_path);
			ifstream slicek_csv(slicek_csv_path);
			while (getline(slicek_csv, line))
			{
				const auto rfscore = lexical_cast<fl>(line);
				getline(slice_csv, line);
				const auto comma1 = line.find(',', 1);
				const auto comma2 = comma1 + 9;
				const auto comma3 = line.find(',', comma2 + 6);
				const auto comma4 = line.find(',', comma3 + 6);
				BOOST_ASSERT(line[comma2] == ',');
				vector<fl> energies, efficiencies, rfscores;
				energies.push_back(lexical_cast<fl>(line.substr(comma2 + 1, comma3 - comma2 - 1)));
				efficiencies.push_back(lexical_cast<fl>(line.substr(comma3 + 1, comma4 - comma3 - 1)));
				rfscores.push_back(rfscore);
				phase1_summaries.push_back(new summary(lexical_cast<size_t>(line.substr(0, comma1)), line.substr(comma1 + 1, 8), static_cast<vector<fl>&&>(energies), static_cast<vector<fl>&&>(efficiencies), static_cast<vector<fl>&&>(rfscores), vector<string>(), line.substr(comma4 + 1), string()));
			}
			slice_csv.close();
			slicek_csv.close();
			remove(slice_csv_path);
			remove(slicek_csv_path);
		}
		const auto docked = phase1_summaries.size();
		BOOST_ASSERT(docked <= num_ligands);
		unsigned int num_hits = 1000;
		if (docked < 1000)
		{
			num_hits = docked;
			conn.update(collection, BSON("_id" << _id), BSON("$set" << BSON("hits" << num_hits)));
		}

		// Determine ligand sorting criterion.
		const auto compt_cursor = conn.query(collection, QUERY("_id" << _id), 1, 0, &compt_fields);
		const auto compt = compt_cursor->next();
		const auto sort = compt["sort"].Int();
		BOOST_ASSERT(sort == 0 || sort == 1 || sort == 2);
		const auto sort_summaries_by = sort == 0 ? sort_summaries_by_idockscore : (sort == 1 ? sort_summaries_by_rfscore : sort_summaries_by_consensus);
		const auto sort_results_by = sort == 1 ? sort_results_by_rfscore : sort_results_by_consensus;

		// Sort phase 1 summaries.
		std::sort(phase1_summaries.begin(), phase1_summaries.end(), sort_summaries_by);

		// Write phase 1 csv.
		using boost::iostreams::filtering_ostream;
		using boost::iostreams::gzip_compressor;
		{
			ofstream phase1_csv(job_path / "phase1.csv.gz");
			filtering_ostream phase1_csv_gz;
			phase1_csv_gz.push(gzip_compressor());
			phase1_csv_gz.push(phase1_csv);
			phase1_csv_gz.setf(std::ios::fixed, std::ios::floatfield);
			phase1_csv_gz << std::setprecision(3);
			phase1_csv_gz << "ZINC ID,Free energy (kcal/mol),Ligand efficiency (kcal/mol),RF-Score,Consensus score,Molecular weight (g/mol),Partition coefficient xlogP,Apolar desolvation (kcal/mol),Polar desolvation (kcal/mol),Hydrogen bond donors,Hydrogen bond acceptors,Polar surface area tPSA (A^2),Net charge,Rotatable bonds\n";
			for (const auto& s : phase1_summaries)
			{
				BOOST_ASSERT(s.energies.size() == 1);
				BOOST_ASSERT(s.efficiencies.size() == 1);
				BOOST_ASSERT(s.rfscores.size() == 1);
				phase1_csv_gz << s.lig_id << ',' << s.energies.front() << ',' << s.efficiencies.front() << ',' << s.rfscores.front() << ',' << s.consensuses.front() << ',' << s.property << '\n';
			}
		}

		// Perform phase 2.
		const auto f_csv_path = job_path / "F.csv";
		const auto k_csv_path = job_path / "K.csv";
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

			// Get the remark line and supplier line.
			string remark, supplier;
			getline(ligands, remark);   // REMARK     00000007  277.364    2.510    9.000  -14.930   0   4  39   0   8    
			getline(ligands, supplier); // REMARK     6 | chembl11 | chembl12 | chembl13 | chembl14 | enamine-v | pubchem

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
				BOOST_ASSERT(gm_tasks.empty());
				for (size_t x = 0; x < num_gm_tasks; ++x)
				{
					gm_tasks.push_back(new packaged_task<void>(bind<void>(grid_map_task, boost::ref(grid_maps), boost::cref(atom_types_to_populate), x, boost::cref(sf), boost::cref(b), boost::cref(rec))));
				}
				tp.run(gm_tasks);
				for (auto& t : gm_tasks)
				{
					t.get_future().get();
				}
				tp.sync();
				gm_tasks.clear();
				atom_types_to_populate.clear();
			}

			// Run Monte Carlo tasks.
			BOOST_ASSERT(mc_tasks.empty());
			for (size_t i = 0; i < phase2_num_mc_tasks; ++i)
			{
				BOOST_ASSERT(phase2_result_containers[i].empty());
				mc_tasks.push_back(new packaged_task<void>(bind<void>(monte_carlo_task, boost::ref(phase2_result_containers[i]), boost::cref(lig), eng(), boost::cref(alphas), boost::cref(sf), boost::cref(b), boost::cref(grid_maps))));
			}
			tp.run(mc_tasks);

			// Merge results from all the tasks into one single result container.
			BOOST_ASSERT(phase2_results.empty());
			const fl required_square_error = static_cast<fl>(4 * lig.num_heavy_atoms); // Ligands with RMSD < 2.0 will be clustered into the same cluster.
			for (size_t i = 0; i < phase2_num_mc_tasks; ++i)
			{
				mc_tasks[i].get_future().get();
				ptr_vector<result>& task_results = phase2_result_containers[i];
				for (auto& task_result : task_results)
				{
					add_to_result_container(phase2_results, static_cast<result&&>(task_result), required_square_error);
				}
				task_results.clear();
			}

			// Block until all the Monte Carlo tasks are completed.
			tp.sync();
			mc_tasks.clear();

			const size_t num_results = std::min<size_t>(phase2_results.size(), max_conformations);

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

			if (num_conformations)
			{
				const size_t num_lig_hbda = lig.hbda.size();
				vector<size_t> features(RF_TYPE_SIZE << 2);
				ofstream f_csv(f_csv_path);
				f_csv << "6.6,7.6,8.6,16.6,6.7,7.7,8.7,16.7,6.8,7.8,8.8,16.8,6.16,7.16,8.16,16.16,6.15,7.15,8.15,16.15,6.9,7.9,8.9,16.9,6.17,7.17,8.17,16.17,6.35,7.35,8.35,16.35,6.53,7.53,8.53,16.53\n";
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

					// Extract RF-Score features
					for (auto& f : features) f = 0;
					for (size_t i = 0; i < lig.num_heavy_atoms; ++i)
					{
						if (lig.heavy_atoms[i].rf == RF_TYPE_SIZE) continue;
						for (const auto& a : rec.atoms)
						{
							if (a.rf == RF_TYPE_SIZE) continue;
							const auto dist_sqr = distance_sqr(r.heavy_atoms[i], a.coordinate);
							if (dist_sqr >= 144) continue;
							++features[(lig.heavy_atoms[i].rf << 2) + a.rf];
						}
					}
					f_csv << features[0];
					for (size_t i = 1; i < features.size(); ++i)
					{
						f_csv << ',' << features[i];
					}
					f_csv << '\n';
				}
				f_csv.close();

				// Call Rscript RF-Score.r
				create_child(rscript, vector<string> {"RF-Score.r", f_csv_path.string(), k_csv_path.string()}, boost::process::context()).wait();

				// Parse RF-Score.
				ifstream k_csv(k_csv_path);
				for (size_t k = 0; k < num_conformations; ++k)
				{
					getline(k_csv, line);
					auto& r = phase2_results[k];
					r.rfscore = lexical_cast<fl>(line);
					r.consensus = (r.rfscore + energy2pK * r.e_nd) * 0.5;
				}

				// Sort results by RF-Score or consensus if necessary.
				if (sort) std::sort(phase2_results.begin(), phase2_results.begin() + num_conformations, sort_results_by);

				// Write models to file.
				lig.write_models(hits_pdbqt_path, remark, supplier, phase2_results, num_conformations, b, grid_maps);

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
			}

			// Clear the results of the current ligand.
			phase2_results.clear();

			// Report progress every ligand.
			conn.update(collection, BSON("_id" << _id), BSON("$inc" << BSON("refined" << 1)));
		}

		// Cleanup F.csv and K.csv
		remove(f_csv_path);
		remove(k_csv_path);

		// Sort phase 2 summaries.
		std::sort(phase2_summaries.begin(), phase2_summaries.end(), sort_summaries_by);

		// Write phase 2 csv.
		{
			ofstream phase2_csv(job_path / "phase2.csv.gz");
			filtering_ostream phase2_csv_gz;
			phase2_csv_gz.push(gzip_compressor());
			phase2_csv_gz.push(phase2_csv);
			phase2_csv_gz.setf(std::ios::fixed, std::ios::floatfield);
			phase2_csv_gz << std::setprecision(3);
			phase2_csv_gz << "ZINC ID,Conformations";
			for (size_t i = 1; i <= max_conformations; ++i) phase2_csv_gz << ",Conformation " << i << " free energy (kcal/mol2),Conformation " << i << " ligand efficiency (kcal/mol),Conformation " << i << " RF-Score,Conformation " << i << " consensus score,Conformation " << i << " hydrogen bonds";
			phase2_csv_gz << ",Molecular weight (g/mol),Partition coefficient xlogP,Apolar desolvation (kcal/mol),Polar desolvation (kcal/mol),Hydrogen bond donors,Hydrogen bond acceptors,Polar surface area tPSA (A^2),Net charge,Rotatable bonds,Substance information,Suppliers\n";
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
					phase2_csv_gz << ",,,,";
				}
				phase2_csv_gz << ',' << s.property << ",http://zinc.docking.org/substance/" << s.lig_id << ',' << s.supplier << '\n';
			}
		}

		// Set done time.
		using boost::chrono::system_clock;
		using boost::chrono::duration_cast;
		using chrono_millis = boost::chrono::milliseconds;
		const auto millis_since_epoch = duration_cast<chrono_millis>(system_clock::now().time_since_epoch()).count();
		conn.update(collection, BSON("_id" << _id), BSON("$set" << BSON("done" << Date_t(millis_since_epoch))));

		// Send completion notification email.
		const auto email = compt["email"].String();
		cout << "Sending a completion notification email to " << email << '\n';
		using Poco::Net::MailMessage;
		using Poco::Net::MailRecipient;
		using Poco::Net::SMTPClientSession;
		MailMessage message;
		message.setSender("idock <noreply@cse.cuhk.edu.hk>");
		message.setSubject("Your idock job has completed");
		using boost::posix_time::ptime;
		using posix_millis = boost::posix_time::milliseconds;
		using boost::posix_time::to_simple_string;
		message.setContent("Your idock job submitted on " + to_simple_string(ptime(epoch, posix_millis(compt["submitted"].Date().millis))) + " UTC docking " + lexical_cast<string>(num_ligands) + " ligands with description as \"" + compt["description"].String() + "\" was done on " + to_simple_string(ptime(epoch, posix_millis(millis_since_epoch))) + " UTC. " + lexical_cast<string>(docked) + " ligands were docked and " + lexical_cast<string>(num_hits) + " hits were refined. View result at http://idock.cse.cuhk.edu.hk");
		message.addRecipient(MailRecipient(MailRecipient::PRIMARY_RECIPIENT, email));
		SMTPClientSession session("137.189.91.190");
		session.login();
		session.sendMessage(message);
		session.close();
	}
}
