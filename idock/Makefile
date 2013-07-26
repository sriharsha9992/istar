CC=clang++ -std=c++11 -O3

bin/idock: obj/scoring_function.o obj/box.o obj/quaternion.o obj/thread_pool.o obj/receptor.o obj/ligand.o obj/grid_map_task.o obj/monte_carlo_task.o obj/random_forest.o obj/random_forest_x.o obj/random_forest_y.o obj/main.o
	$(CC) -o $@ $^ -pthread -lboost_thread -lboost_system -lboost_filesystem -lboost_iostreams -lboost_date_time -L${POCO_ROOT}/lib/Linux/x86_64 -lPocoFoundation -lPocoNet -L${MONGODB_ROOT}/build/linux2/64/release/use-system-all/client_build -lmongoclient

obj/main.o: src/main.cpp 
	$(CC) -o $@ $< -c -I${MONGODB_ROOT}/src -I${POCO_ROOT}/Net/include

obj/%.o: src/%.cpp 
	$(CC) -o $@ $< -c

clean:
	rm -f bin/idock obj/*.o
