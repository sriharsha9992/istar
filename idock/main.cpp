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

#include <syslog.h>
#include <ctime>
#include <boost/thread/thread.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/fstream.hpp>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
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
	using std::string;
	using boost::array;
	using boost::filesystem::path;
	using boost::filesystem::ifstream;
	using boost::filesystem::ofstream;
	using boost::thread;
	using boost::bind;
	using namespace idock;

	// Daemonize itself, retaining the current working directory and redirecting stdin, stdout and stderr to /dev/null.
	daemon(1, 0);
	syslog(LOG_INFO, "idock 1.5");

	// Fetch command line arguments.
	const auto host = argv[1];
	const auto user = argv[2];
	const auto pwd = argv[3];
	const auto jobs_path = argv[4];

	using namespace mongo;
	DBClientConnection conn;
	{
		// Connect to host and authenticate user.
		syslog(LOG_INFO, "Connecting to %s and authenticating %s", host, user);
		string errmsg;
		if ((!conn.connect(host, errmsg)) || (!conn.auth("istar", user, pwd, errmsg)))
		{
			syslog(LOG_ERR, errmsg.c_str());
			return 1;
		}
	}

	// Initialize default values of constant arguments.
	const auto collection = "istar.idock";
	const auto jobid_fields = BSON("_id" << 1 << "scheduled" << 1);
	const auto param_fields = BSON("_id" << 0 << "receptor" << 1 << "ligands" << 1 << "center_x" << 1 << "center_y" << 1 << "center_z" << 1 << "size_x" << 1 << "size_y" << 1 << "size_z" << 1 << "mwt_lb" << 1 << "mwt_ub" << 1 << "logp_lb" << 1 << "logp_ub" << 1 << "ad_lb" << 1 << "ad_ub" << 1 << "pd_lb" << 1 << "pd_ub" << 1 << "hbd_lb" << 1 << "hbd_ub" << 1 << "hba_lb" << 1 << "hba_ub" << 1 << "tpsa_lb" << 1 << "tpsa_ub" << 1 << "charge_lb" << 1 << "charge_ub" << 1 << "nrb_lb" << 1 << "nrb_ub" << 1);
	const auto compt_fields = BSON("_id" << 0 << "email" << 1 << "submitted" << 1 << "description" << 1);
	const path ligands_path = "16_lig.pdbqt";
	const path headers_path = "16_hdr.bin";
	const size_t num_threads = thread::hardware_concurrency();
	const size_t seed = time(0);
	const size_t phase1_num_mc_tasks = 2; // TODO: revert to 32.
	const size_t phase2_num_mc_tasks = 32; // TODO: revert to 256.
	const size_t max_conformations = 20;
	const size_t max_results = 20; // Maximum number of results obtained from a single Monte Carlo task.
	const size_t slices[101] = { 0, 121712, 243424, 365136, 486848, 608560, 730272, 851984, 973696, 1095408, 1217120, 1338832, 1460544, 1582256, 1703968, 1825680, 1947392, 2069104, 2190816, 2312528, 2434240, 2555952, 2677664, 2799376, 2921088, 3042800, 3164512, 3286224, 3407936, 3529648, 3651360, 3773072, 3894784, 4016496, 4138208, 4259920, 4381632, 4503344, 4625056, 4746768, 4868480, 4990192, 5111904, 5233616, 5355328, 5477040, 5598752, 5720464, 5842176, 5963888, 6085600, 6207312, 6329024, 6450736, 6572448, 6694160, 6815872, 6937584, 7059296, 7181008, 7302720, 7424432, 7546144, 7667856, 7789568, 7911280, 8032992, 8154704, 8276416, 8398128, 8519840, 8641552, 8763264, 8884976, 9006688, 9128400, 9250112, 9371824, 9493536, 9615248, 9736960, 9858672, 9980384, 10102096, 10223808, 10345520, 10467232, 10588944, 10710655, 10832366, 10954077, 11075788, 11197499, 11319210, 11440921, 11562632, 11684343, 11806054, 11927765, 12049476, 12171187 };
	const fl energy_range = 3.0;
	const fl grid_granularity = 0.8; // TODO: revert to 0.08
	const auto epoch = boost::gregorian::date(1970, 1, 1);

	// Initialize variables for job caching.
	auto _id = OID(); // TODO
	path job_path;
	double center_x, center_y, center_z, mwt_lb, mwt_ub, logp_lb, logp_ub, ad_lb, ad_ub, pd_lb, pd_ub;
	int num_ligands, size_x, size_y, size_z, hbd_lb, hbd_ub, hba_lb, hba_ub, tpsa_lb, tpsa_ub, charge_lb, charge_ub, nrb_lb, nrb_ub;
	box b;
	receptor rec;
	array3d<vector<size_t>> partitions;
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
	string line; line.reserve(80);
	vector<size_t> atom_types_to_populate; atom_types_to_populate.reserve(XS_TYPE_SIZE);
	ptr_vector<packaged_task<void>> mc_tasks(phase2_num_mc_tasks);
	ptr_vector<ptr_vector<result>> phase1_result_containers, phase2_result_containers;
	phase1_result_containers.resize(phase1_num_mc_tasks);
	phase2_result_containers.resize(phase2_num_mc_tasks);
	for (auto& rc : phase1_result_containers) rc.reserve(1);
	for (auto& rc : phase2_result_containers) rc.reserve(max_results);
	ptr_vector<result> phase1_results, phase2_results;
	phase1_results.reserve(1);
	phase2_results.reserve(max_results * phase2_num_mc_tasks);
	
	// Open files for reading.
	ifstream headers(headers_path);
	ifstream ligands(ligands_path);

	while (true)
	{
		// Fetch a job in a FCFS manner.
		using namespace bson;
		auto jobid_cursor = conn.query(collection, QUERY("scheduled" << BSON("$lt" << 100)).sort("submitted"), 1, 0, &jobid_fields); // nToReturn = 1, nToSkip = 0, fieldsToReturn
		if (!jobid_cursor->more())
		{
			// Sleep for a while.
			using boost::this_thread::sleep_for;
			using boost::chrono::seconds;
			sleep_for(seconds(1));
			continue;
		}
		const auto job = jobid_cursor->next();
		conn.update(collection, BSON("_id" << job["_id"] << "$atomic" << 1), BSON("$inc" << BSON("scheduled" << 1)));

		// Refresh cache if it is a new job.
		if (_id != job["_id"].OID())
		{
			_id = job["_id"].OID();
			job_path = jobs_path / _id.str();
			if (!exists(job_path)) create_directory(job_path);

			auto param_cursor = conn.query(collection, QUERY("_id" << _id), 1, 0, &param_fields);
			const auto param = param_cursor->next();
			rec = receptor(param["receptor"].String());
			num_ligands = param["ligands"].Int();
			center_x = param["center_x"].Number();
			center_y = param["center_y"].Number();
			center_z = param["center_z"].Number();
			size_x = param["size_x"].Int();
			size_y = param["size_y"].Int();
			size_z = param["size_z"].Int();
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

			// Initialize the search space of cuboid shape.
			b = box(vec3(center_x, center_y, center_z), vec3(size_x, size_y, size_z), grid_granularity);

			// Divide the box into coarse-grained partitions for subsequent grid map creation.
			partitions = array3d<vector<size_t>>(b.num_partitions);
			{
				// Find all the heavy receptor atoms that are within 8A of the box.
				vector<size_t> receptor_atoms_within_cutoff;
				receptor_atoms_within_cutoff.reserve(rec.atoms.size());
				const size_t num_rec_atoms = rec.atoms.size();
				for (size_t i = 0; i < num_rec_atoms; ++i)
				{
					const atom& a = rec.atoms[i];
					if (b.within_cutoff(a.coordinate))
					{
						receptor_atoms_within_cutoff.push_back(i);
					}
				}
				const size_t num_receptor_atoms_within_cutoff = receptor_atoms_within_cutoff.size();

				// Allocate each nearby receptor atom to its corresponding partition.
				for (size_t x = 0; x < b.num_partitions[0]; ++x)
				for (size_t y = 0; y < b.num_partitions[1]; ++y)
				for (size_t z = 0; z < b.num_partitions[2]; ++z)
				{
					partitions(x, y, z).reserve(num_receptor_atoms_within_cutoff);
					const array<size_t, 3> index1 = {{ x,     y,     z     }};
					const array<size_t, 3> index2 = {{ x + 1, y + 1, z + 1 }};
					const vec3 corner1 = b.partition_corner1(index1);
					const vec3 corner2 = b.partition_corner1(index2);
					for (size_t l = 0; l < num_receptor_atoms_within_cutoff; ++l)
					{
						const size_t i = receptor_atoms_within_cutoff[l];
						if (b.within_cutoff(corner1, corner2, rec.atoms[i].coordinate))
						{
							partitions(x, y, z).push_back(i);
						}
					}
				}
			}

			// Reserve storage for grid map task container.
			num_gm_tasks = b.num_probes[0];
			gm_tasks.reserve(num_gm_tasks);
			
			// Clear grid maps.
			grid_maps.clear();
			grid_maps.resize(XS_TYPE_SIZE);
		}
		const auto slice = job["scheduled"].Int();

		// Perform phase 1.
		syslog(LOG_INFO, "Executing job %s phase 1 slice %d", _id, slice);
		const auto slice_key = lexical_cast<string>(slice);
		const auto start_lig = slices[slice];
		const auto end_lig = slices[slice + 1];

		headers.seekg(sizeof(size_t) * start_lig);
		ofstream slice_csv(job_path / (slice_key + ".csv")); // TODO: use bin instead of csv, one uint16_t for index, one size_t for ZINC ID and one float for free energy.
		slice_csv.setf(std::ios::fixed, std::ios::floatfield);
		slice_csv << std::setprecision(3);
		for (size_t i = start_lig; i < end_lig; ++i)
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

			// Parse the ligand.
			ligand lig(ligands, lig_id);

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
					gm_tasks.push_back(new packaged_task<void>(bind<void>(grid_map_task, boost::ref(grid_maps), boost::cref(atom_types_to_populate), x, boost::cref(sf), boost::cref(b), boost::cref(rec), boost::cref(partitions))));
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
				// Dump ligand summaries to the csv file.
				slice_csv << i << ',' << lig_id << ',' << (phase1_results.front().f * lig.flexibility_penalty_factor) << '\n';

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
		syslog(LOG_INFO, "Executing job %s phase 2", _id);

		// Combine and delete multiple slice csv's.
		ptr_vector<summary> phase1_summaries(num_ligands);
		for (size_t s = 0; s < 100; ++s)
		{
			const auto slice_csv_path = job_path / (lexical_cast<string>(s) + ".csv");
			ifstream in(slice_csv_path);
			while (getline(in, line))
			{
				const auto comma = line.find(',', 1);
				vector<fl> energies;
				energies.push_back(lexical_cast<fl>(line.substr(comma + 10)));
				phase1_summaries.push_back(new summary(lexical_cast<size_t>(line.substr(0, comma)), line.substr(comma + 1, 8), static_cast<vector<fl>&&>(energies)));
			}
			in.close();
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

		// Write phase 1 csv.
		phase1_summaries.sort();
		using boost::iostreams::filtering_ostream;
		using boost::iostreams::gzip_compressor;
		{
			ofstream phase1_csv(job_path / "phase1.csv.gz");
			filtering_ostream phase1_csv_gz;
			phase1_csv_gz.push(gzip_compressor());
			phase1_csv_gz.push(phase1_csv);
			phase1_csv_gz.setf(std::ios::fixed, std::ios::floatfield);
			phase1_csv_gz << std::setprecision(3);
			phase1_csv_gz << "ZINC ID,FE1\n";
			for (const auto& s : phase1_summaries)
			{
				phase1_csv_gz << s.lig_id << ',' << s.energies.front() << '\n';
			}
		}

		// Perform phase 2.
		const path hits_pdbqt_path = job_path / "hits.pdbqt.gz";
		ptr_vector<summary> phase2_summaries(num_hits);
		for (auto i = 0; i < num_hits; ++i)
		{
			// Locate a ligand.
			const auto& s = phase1_summaries[i];
			headers.seekg(sizeof(size_t) * s.index);
			size_t header;
			headers.read((char*)&header, sizeof(size_t));
			ligands.seekg(header);

			// Assert if the ligand satisfies the filtering conditions.
			getline(ligands, line);
			const auto lig_id = line.substr(11, 8);
			const auto mwt = right_cast<fl>(line, 21, 28);
			const auto logp = right_cast<fl>(line, 30, 37);
			const auto ad = right_cast<fl>(line, 39, 46);
			const auto pd = right_cast<fl>(line, 48, 55);
			const auto hbd = right_cast<int>(line, 57, 59);
			const auto hba = right_cast<int>(line, 61, 63);
			const auto tpsa = right_cast<int>(line, 65, 67);
			const auto charge = right_cast<int>(line, 69, 71);
			const auto nrb = right_cast<int>(line, 73, 75);
			BOOST_ASSERT(lig_id == s.lig_id);
			BOOST_ASSERT((mwt_lb <= mwt) && (mwt <= mwt_ub) && (logp_lb <= logp) && (logp <= logp_ub) && (ad_lb <= ad) && (ad <= ad_ub) && (pd_lb <= pd) && (pd <= pd_ub) && (hbd_lb <= hbd) && (hbd <= hbd_ub) && (hba_lb <= hba) && (hba <= hba_ub) && (tpsa_lb <= tpsa) && (tpsa <= tpsa_ub) && (charge_lb <= charge) && (charge <= charge_ub) && (nrb_lb <= nrb) && (nrb <= nrb_ub));

			// Parse the ligand.
			ligand lig(ligands, lig_id);

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
					gm_tasks.push_back(new packaged_task<void>(bind<void>(grid_map_task, boost::ref(grid_maps), boost::cref(atom_types_to_populate), x, boost::cref(sf), boost::cref(b), boost::cref(rec), boost::cref(partitions))));
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

			// Adjust free energy relative to flexibility.
			result& best_result = phase2_results.front();
			const fl best_result_intra_e = best_result.e - best_result.f;
			for (size_t i = 0; i < num_results; ++i)
			{
				phase2_results[i].e_nd = (phase2_results[i].e - best_result_intra_e) * lig.flexibility_penalty_factor;
			}

			// Determine the number of conformations to output according to user-supplied max_conformations and energy_range.
			const fl energy_upper_bound = best_result.e_nd + energy_range;
			size_t num_conformations;
			for (num_conformations = 1; (num_conformations < num_results) && (phase2_results[num_conformations].e_nd <= energy_upper_bound); ++num_conformations);

			if (num_conformations)
			{
				// Write models to file.
				lig.write_models(hits_pdbqt_path, phase2_results, num_conformations, b, grid_maps);

				// Add to summaries.
				vector<fl> energies(num_conformations);
				for (size_t k = 0; k < num_conformations; ++k)
				{
					energies[k] = phase2_results[k].e_nd;
				}
				phase2_summaries.push_back(new summary(s.index, s.lig_id, static_cast<vector<fl>&&>(energies)));
			}

			// Clear the results of the current ligand.
			phase2_results.clear();

			// Report progress every ligand.
			conn.update(collection, BSON("_id" << _id), BSON("$inc" << BSON("refined" << 1)));
		}

		// Write phase 2 csv.
		phase2_summaries.sort();
		{
			ofstream phase2_csv(job_path / "phase2.csv.gz");
			filtering_ostream phase2_csv_gz;
			phase2_csv_gz.push(gzip_compressor());
			phase2_csv_gz.push(phase2_csv);
			phase2_csv_gz.setf(std::ios::fixed, std::ios::floatfield);
			phase2_csv_gz << std::setprecision(3);
			phase2_csv_gz << "Ligand,Conf";
			for (size_t i = 1; i <= max_conformations; ++i) phase2_csv_gz << ",FE" << i/* << ",HB" << i*/;
			phase2_csv_gz << '\n';
			for (const auto& s : phase2_summaries)
			{
				const size_t num_conformations = s.energies.size();
				phase2_csv_gz << s.lig_id << ',' << num_conformations;
				for (size_t j = 0; j < num_conformations; ++j)
				{
					phase2_csv_gz << ',' << s.energies[j]/* << ',' << s.hbonds[j]*/;
				}
				for (size_t j = num_conformations; j < max_conformations; ++j)
				{
					phase2_csv_gz << ',';
				}
				phase2_csv_gz << '\n';
			}
		}

		// Set done time.
		using boost::chrono::system_clock;
		using boost::chrono::duration_cast;
		using chrono_millis = boost::chrono::milliseconds;
		const auto millis_since_epoch = duration_cast<chrono_millis>(system_clock::now().time_since_epoch()).count();
		conn.update(collection, BSON("_id" << _id), BSON("$set" << BSON("done" << Date_t(millis_since_epoch))));

		// Send completion notification email.
		const auto compt_cursor = conn.query(collection, QUERY("_id" << _id), 1, 0, &compt_fields);
		const auto compt = compt_cursor->next();
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
