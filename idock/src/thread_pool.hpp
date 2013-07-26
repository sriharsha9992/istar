#pragma once
#ifndef IDOCK_THREAD_POOL_HPP
#define IDOCK_THREAD_POOL_HPP

#include <vector>
#include <future>
using std::vector;
using std::packaged_task;
using std::bind;
using std::ref;
using std::cref;
using std::thread;
using std::condition_variable;
using std::mutex;
using std::function;
using std::future;
using std::unique_lock;

class thread_pool : public vector<packaged_task<void()>>
{
public:
	explicit thread_pool(const size_t num_threads);
	void sync();
	~thread_pool();
private:
	vector<thread> threads;
	size_t num_scheduled_tasks;
	size_t num_completed_tasks;
	condition_variable task_completion;
	condition_variable task_incoming;
	bool exiting;
	mutable mutex m;
	thread_pool(thread_pool const&);
	thread_pool& operator=(thread_pool const&);
};

#endif
