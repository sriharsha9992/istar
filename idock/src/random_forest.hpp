#pragma once
#ifndef IDOCK_RANDOM_FOREST_HPP
#define IDOCK_RANDOM_FOREST_HPP

#include <vector>
#include <array>
using namespace std;

class node
{
public:
	vector<size_t> samples; ///< Node samples
	float y; ///< Average of y values of node samples
	float p; ///< Node purity, measured as either y * y * nSamples or sum * sum / nSamples
	size_t var; ///< Variable used for node split
	float val; ///< Value used for node split
	array<size_t, 2> children; ///< Two child nodes

	/// Constructs an empty leaf node.
	explicit node()
	{
		children[0] = 0;
	}
};

class tree : public vector<node>
{
public:
	static const size_t nv = 36;

	/// Grows an empty tree from bootstrap samples
	int grow(const size_t mtry, const size_t seed);

	/// Predict the y value of the given sample x
	float predict(const array<float, nv>& x) const;

	/// Clear node samples to save memory
	void clear();
private:
	static const size_t ns = 2897;
	static const array<array<float, nv>, ns> x;
	static const array<float, ns> y;
};

class forest : public vector<tree>
{
public:
	forest(const size_t n) : vector<tree>(n)
	{
	}

	/// Predict the y value of the given sample x
	float predict(const array<float, tree::nv>& x) const;

	/// Clear node samples to save memory
	void clear();
};

#endif
