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

#include <iostream>
#include <iomanip>
#include <boost/thread/thread.hpp>
#include <boost/program_options.hpp>
#include <boost/filesystem/operations.hpp>
#include <mongo/client/dbclient.h>
#include "fstream.hpp"
#include "seed.hpp"
#include "receptor.hpp"
#include "ligand.hpp"
#include "thread_pool.hpp"
#include "grid_map_task.hpp"
#include "monte_carlo_task.hpp"
#include "summary.hpp"

int main(int argc, char* argv[])
{
	using namespace idock;
	path receptor_path, ligand_folder_path, output_folder_path, log_path, csv_path;
	fl center_x, center_y, center_z, size_x, size_y, size_z;
	size_t num_threads, seed, num_mc_tasks, max_conformations;
	fl energy_range, grid_granularity;

	// Initialize the default values of optional arguments.
	const path default_output_folder_path = "output";
	const path default_log_path = "log.txt";
	const path default_csv_path = "log.csv";
	const unsigned int concurrency = boost::thread::hardware_concurrency();
	const size_t default_num_threads = concurrency ? concurrency : 1;
	const size_t default_seed = random_seed();
	const size_t default_num_mc_tasks = 32;
	const size_t default_max_conformations = 9;
	const fl default_energy_range = 3.0;
	const fl default_grid_granularity = 0.15625;

	// Create program options.
	string host, db, user, pwd;
	using namespace boost::program_options;
	options_description options("input (required)");
	options.add_options()
		("host", value<string>(&host)->required(), "server to connect to")
		("db"  , value<string>(&db  )->required(), "database to login to")
		("user", value<string>(&user)->required(), "username for authentication")
		("pwd" , value<string>(&pwd )->required(), "password for authentication")
		;

	// If no command line argument is supplied, simply print the usage and exit.
	using std::cout;
	if (argc == 1)
	{
		cout << options;
		return 0;
	}

	// Parse command line arguments.
	variables_map vm;
	store(parse_command_line(argc, argv, options), vm);
	vm.notify();

	using namespace mongo;
	using namespace bson;

	// Connect to host.
	DBClientConnection c;
	cout << "Connecting to " << host << '\n';
	c.connect(host);

	// Authenticate user.
	cout << "Authenticating user " << user << '\n';
	string errmsg;
	c.auth(db, user, pwd, errmsg);

	// Fetch a pending job.
	// Start a transaction, fetch a job where machine == null, and update machine.
	auto cursor = c.query("istar.jobs", QUERY("progress" << 0), 1);
	if (cursor->more())
	{
		auto p = cursor->next();
		cout << p["name"] << '\n';
	}

	const auto e = c.getLastError();
	if (!e.empty())
	{ 
		cerr << e << '\n';
	}

	// Perform screening, filter ligands, and write zero conformation. Refresh progress every 1%.	
	//const string _id = "4433";
	//db.update("istar.jobs", BSON("_id" << _id << "$atomic" << 1), BSON("$inc" << BSON("progress" << 1)));
	
	// Send email with link to /.

	// Initialize a Mersenne Twister random number generator.
	cout << "Using random seed " << seed << '\n';
	mt19937eng eng(seed);

	// Initialize the search space of cuboid shape.
	const box b(vec3(center_x, center_y, center_z), vec3(size_x, size_y, size_z), grid_granularity);

	// Parse the receptor.
	cout << "Parsing receptor " << receptor_path << '\n';
	const receptor rec(receptor_path);

	// Divide the box into coarse-grained partitions for subsequent grid map creation.
	using boost::array;
	array3d<vector<size_t>> partitions(b.num_partitions);
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

	// Reserve storage for task containers.
	const size_t num_gm_tasks = b.num_probes[0];
	ptr_vector<packaged_task<void>> gm_tasks(num_gm_tasks);
	ptr_vector<packaged_task<void>> mc_tasks(num_mc_tasks);

	// Reserve storage for result containers. ptr_vector<T> is used for fast sorting.
	const size_t max_results = 20; // Maximum number of results obtained from a single Monte Carlo task.
	ptr_vector<ptr_vector<result>> result_containers;
	result_containers.resize(num_mc_tasks);
	for (size_t i = 0; i < num_mc_tasks; ++i)
	{
		result_containers[i].reserve(max_results);
	}
	ptr_vector<result> results;
	results.reserve(max_results * num_mc_tasks);

	// Precalculate alpha values for determining step size in BFGS.
	array<fl, num_alphas> alphas;
	alphas[0] = 1;
	for (size_t i = 1; i < num_alphas; ++i)
	{
		alphas[i] = alphas[i - 1] * 0.1;
	}

	// Initialize a vector of empty grid maps. Each grid map corresponds to an XScore atom type.
	vector<array3d<fl>> grid_maps(XS_TYPE_SIZE);
	vector<size_t> atom_types_to_populate;
	atom_types_to_populate.reserve(XS_TYPE_SIZE);

	// Initialize a thread pool and create worker threads for later use.
	cout << "Creating a thread pool of " << num_threads << " worker thread" << ((num_threads == 1) ? "" : "s") << '\n';
	thread_pool tp(num_threads);

	// Precalculate the scoring function in parallel.
	cout << "Precalculating scoring function in parallel ";
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
			sf_tasks.push_back(new packaged_task<void>(boost::bind<void>(&scoring_function::precalculate, boost::ref(sf), t1, t2, boost::cref(rs))));
		}
		BOOST_ASSERT(sf_tasks.size() == num_sf_tasks);

		// Run the scoring function tasks in parallel asynchronously and display the progress bar with hashes.
		tp.run(sf_tasks);

		// Wait until all the scoring function tasks are completed.
		tp.sync();
	}
	cout << '\n';

	cout << "Running " << num_mc_tasks << " Monte Carlo task" << ((num_mc_tasks == 1) ? "" : "s") << " per ligand\n";

	// Perform docking for each file in the ligand folder.
	cout << "  Index |       Ligand |   Progress | Conf | Top 4 conf free energy in kcal/mol\n" << std::setprecision(3);
	size_t num_ligands = 0; // Ligand counter.
	size_t num_conformations; // Number of conformation to output.
	using boost::filesystem::directory_iterator;
	const directory_iterator end_dir_iter; // A default constructed directory_iterator acts as the end iterator.
	for (directory_iterator dir_iter(ligand_folder_path); dir_iter != end_dir_iter; ++dir_iter)
	{
		// Increment the ligand counter.
		++num_ligands;

		// Obtain a ligand.
		const path input_ligand_path = dir_iter->path();
				
		// Skip the current ligand if it has been docked.
		const path output_ligand_path = output_folder_path / input_ligand_path.filename();
		if (exists(output_ligand_path)) continue;
				
		// Parse the ligand.
		ligand lig(input_ligand_path);

		// Create grid maps on the fly if necessary.
		BOOST_ASSERT(atom_types_to_populate.empty());
		const vector<size_t> ligand_atom_types = lig.get_atom_types();
		const size_t num_ligand_atom_types = ligand_atom_types.size();
		for (size_t i = 0; i < num_ligand_atom_types; ++i)
		{
			const size_t t = ligand_atom_types[i];
			BOOST_ASSERT(t < XS_TYPE_SIZE);
			array3d<fl>& grid_map = grid_maps[t];
			if (grid_map.initialized()) continue; // The grid map of XScore atom type t has already been populated.
			grid_map.resize(b.num_probes); // An exception may be thrown in case memory is exhausted.
			atom_types_to_populate.push_back(t);  // The grid map of XScore atom type t has not been populated and should be populated now.
		}
		const size_t num_atom_types_to_populate = atom_types_to_populate.size();
		if (num_atom_types_to_populate)
		{
			// Creating grid maps is an intermediate step, and thus should not be dumped to the log file.
			cout << "Creating " << std::setw(2) << num_atom_types_to_populate << " grid map" << ((num_atom_types_to_populate == 1) ? ' ' : 's') << "    " << std::flush;

			// Populate the grid map task container.
			BOOST_ASSERT(gm_tasks.empty());
			for (size_t x = 0; x < num_gm_tasks; ++x)
			{
				gm_tasks.push_back(new packaged_task<void>(boost::bind<void>(grid_map_task, boost::ref(grid_maps), boost::cref(atom_types_to_populate), x, boost::cref(sf), boost::cref(b), boost::cref(rec), boost::cref(partitions))));
			}

			// Run the grid map tasks in parallel asynchronously and display the progress bar with hashes.
			tp.run(gm_tasks);

			// Propagate possible exceptions thrown by grid_map_task().
			for (size_t i = 0; i < num_gm_tasks; ++i)
			{
				gm_tasks[i].get_future().get();
			}

			// Block until all the grid map tasks are completed.
			tp.sync();
			gm_tasks.clear();
			atom_types_to_populate.clear();

			// Clear the current line and reset the cursor to the beginning.
			cout << '\r' << std::setw(36) << '\r';
		}

		// Dump the ligand filename.				
		cout << std::setw(7) << num_ligands << " | " << std::setw(12) << output_ligand_path.stem().string() << " | ";
		cout << std::flush;

		// Populate the Monte Carlo task container.
		BOOST_ASSERT(mc_tasks.empty());
		for (size_t i = 0; i < num_mc_tasks; ++i)
		{
			BOOST_ASSERT(result_containers[i].empty());
			mc_tasks.push_back(new packaged_task<void>(boost::bind<void>(monte_carlo_task, boost::ref(result_containers[i]), boost::cref(lig), eng(), boost::cref(alphas), boost::cref(sf), boost::cref(b), boost::cref(grid_maps))));
		}

		// Run the Monte Carlo tasks in parallel asynchronously and display the progress bar with hashes.
		tp.run(mc_tasks);

		// Merge results from all the tasks into one single result container.
		BOOST_ASSERT(results.empty());
		const fl required_square_error = static_cast<fl>(4 * lig.num_heavy_atoms); // Ligands with RMSD < 2.0 will be clustered into the same cluster.
		for (size_t i = 0; i < num_mc_tasks; ++i)
		{
			mc_tasks[i].get_future().get();
			ptr_vector<result>& task_results = result_containers[i];
			const size_t num_task_results = task_results.size();
			for (size_t j = 0; j < num_task_results; ++j)
			{
				add_to_result_container(results, static_cast<result&&>(task_results[j]), required_square_error);
			}
			task_results.clear();
		}

		// Block until all the Monte Carlo tasks are completed.
		tp.sync();
		mc_tasks.clear();

		// Proceed to number of conformations.
		cout << " | ";

		// If no conformation can be found, skip the current ligand and proceed with the next one.
		const size_t num_results = std::min<size_t>(results.size(), max_conformations);
		if (!num_results) // Possible if and only if results.size() == 0 because max_conformations >= 1 is enforced when parsing command line arguments.
		{
			cout << std::setw(4) << 0 << '\n';
			continue;
		}

		// Adjust free energy relative to the best conformation and flexibility.
		const result& best_result = results.front();
		const fl best_result_intra_e = best_result.e - best_result.f;
		for (size_t i = 0; i < num_results; ++i)
		{
			results[i].e_nd = (results[i].e - best_result_intra_e) * lig.flexibility_penalty_factor;
		}

		// Determine the number of conformations to output according to user-supplied max_conformations and energy_range.
		const fl energy_upper_bound = best_result.e_nd + energy_range;
		for (num_conformations = 1; (num_conformations < num_results) && (results[num_conformations].e_nd <= energy_upper_bound); ++num_conformations);

		// Flush the number of conformations to output.
		cout << std::setw(4) << num_conformations << " |";

		// Write the conformations to the output folder.				
		if (num_conformations)
		{
			lig.write_models(output_ligand_path, results, num_conformations, b, grid_maps);
		}

		// Display the free energies of the top 4 conformations.
		const size_t num_energies = std::min<size_t>(num_conformations, 4);
		for (size_t i = 0; i < num_energies; ++i)
		{
			cout << std::setw(8) << results[i].e_nd;
		}
		cout << '\n';

		// Clear the results of the current ligand.
		results.clear();
	}

	// Initialize necessary variables for storing ligand summaries.
	ptr_vector<summary> summaries(num_ligands);
	vector<fl> energies;
	energies.reserve(max_conformations);
	string line;
	line.reserve(79);
		
	using idock::ifstream;
	using idock::ofstream;

	// Scan the output folder to retrieve ligand summaries.
	for (directory_iterator dir_iter(output_folder_path); dir_iter != end_dir_iter; ++dir_iter)
	{
		const path p = dir_iter->path();
		ifstream in(p); // Parsing starts. Open the file stream as late as possible.
		while (getline(in, line))
		{
			if (starts_with(line, "REMARK       NORMALIZED FREE ENERGY PREDICTED BY IDOCK:"))
			{
				energies.push_back(right_cast<fl>(line, 56, 63));
			}
		}
		in.close(); // Parsing finishes. Close the file stream as soon as possible.
		summaries.push_back(new summary(p.stem().string(), energies));
		energies.clear();
	}

	// Sort the summaries.
	summaries.sort();

	// Dump ligand summaries to the csv file.
	cout << "Writing " << csv_path << '\n';
	ofstream csv(csv_path);
	csv << "Ligand,Conf";
	for (size_t i = 1; i <= max_conformations; ++i)
	{
		csv << ",FE" << i;
	}
	csv.setf(std::ios::fixed, std::ios::floatfield);
	csv << '\n' << std::setprecision(3);
	const size_t num_summaries = summaries.size();
	for (size_t i = 0; i < num_summaries; ++i)
	{
		const summary& s = summaries[i];
		const size_t num_conformations = s.energies.size();
		csv << s.filestem << ',' << num_conformations;
		for (size_t j = 0; j < num_conformations; ++j)
		{
			csv << ',' << s.energies[j];
		}
		for (size_t j = num_conformations; j < max_conformations; ++j)
		{
			csv << ',';
		}
		csv << '\n';
	}
	csv.close();
}
