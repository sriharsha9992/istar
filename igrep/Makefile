CC=clang++ -std=c++11 -O3 -DNDEBUG
NVCC=nvcc -gencode arch=compute_13,code=sm_13 -Xptxas=-v -ftz=true -prec-div=false -prec-sqrt=false -use_fast_math# -maxrregcount=N

bin/igrep: obj/kernel.o obj/main.o
	$(CC) -o $@ $^ -pthread -lboost_thread -lboost_system -lboost_filesystem -lboost_iostreams -lboost_chrono -lboost_date_time -L${CUDA_ROOT}/lib64 -lcudart -lcurand -L${POCO_ROOT}/lib/Linux/x86_64 -lPocoFoundation -lPocoNet -L${MONGODB_ROOT}/build/linux2/64/release/use-system-all/client_build -lmongoclient

obj/kernel.o: src/kernel.cu
	$(NVCC) -o $@ $< -c -I${CUDA_ROOT}/samples/common/inc

obj/main.o: src/main.cpp 
	$(CC) -o $@ $< -c -I${MONGODB_ROOT}/src -I${POCO_ROOT}/Net/include -I${CUDA_ROOT}/include

clean:
	rm -f bin/idock obj/*.o
