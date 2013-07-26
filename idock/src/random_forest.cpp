#include <random>
#include <numeric>
#include <algorithm>
#include "random_forest.hpp"

int tree::grow(const size_t mtry, const size_t seed)
{
	// Create bootstrap samples with replacement
	mt19937_64 rng(seed);
	uniform_real_distribution<float> uniform_01(0, 1);
	reserve(ns);
	push_back(node());
	node& root = front();
	root.samples.resize(ns);
	for (size_t& s : root.samples)
	{
		s = static_cast<size_t>(uniform_01(rng) * ns);
	}

	// Populate nodes
	for (size_t k = 0; k < size(); ++k)
	{
		node& n = (*this)[k];

		// Evaluate node y and purity
		float sum = 0.0f;
		for (const size_t s : n.samples) sum += y[s];
		n.y = sum / n.samples.size();
		n.p = n.y * n.y * n.samples.size(); // Equivalent to sum * sum / n.samples.size()

		// Do not split the node if it contains too few samples
		if (n.samples.size() <= 5) continue;

		// Find the best split that has the highest increase in node purity
		float bestChildNodePurity = n.p;
		array<size_t, nv> mind;
		iota(mind.begin(), mind.end(), 0);
		for (size_t i = 0; i < mtry; ++i)
		{
			// Randomly select a variable without replacement
			const size_t j = static_cast<size_t>(uniform_01(rng) * (nv - i));
			const size_t v = mind[j];
			mind[j] = mind[nv - i - 1];

			// Sort the samples in ascending order of the selected variable
			vector<size_t> ncase(n.samples.size());
			iota(ncase.begin(), ncase.end(), 0);
			sort(ncase.begin(), ncase.end(), [&n, v](const size_t val1, const size_t val2)
			{
				return x[n.samples[val1]][v] < x[n.samples[val2]][v];
			});

			// Search through the gaps in the selected variable
			float suml = 0.0f;
			float sumr = sum;
			size_t popl = 0;
			size_t popr = n.samples.size();
			for (size_t j = 0; j < n.samples.size() - 1; ++j)
			{
				const float d = y[n.samples[ncase[j]]];
				suml += d;
				sumr -= d;
				++popl;
				--popr;
				if (x[n.samples[ncase[j]]][v] == x[n.samples[ncase[j+1]]][v]) continue;
				const float curChildNodePurity = (suml * suml / popl) + (sumr * sumr / popr);
				if (curChildNodePurity > bestChildNodePurity)
				{
					bestChildNodePurity = curChildNodePurity;
					n.var = v;
					n.val = (x[n.samples[ncase[j]]][v] + x[n.samples[ncase[j+1]]][v]) * 0.5;
				}
			}
		}

		// Do not split the node if purity does not increase
		if (bestChildNodePurity == n.p) continue;

		// Create two child nodes and distribute samples
		n.children[0] = size();
		push_back(node());
		n.children[1] = size();
		push_back(node());
		for (const size_t s : n.samples)
		{
			(*this)[n.children[x[s][n.var] > n.val]].samples.push_back(s);
		}
	}
	return 0;
}

float tree::predict(const array<float, nv>& x) const
{
	size_t k;
	for (k = 0; (*this)[k].children[0]; k = (*this)[k].children[x[(*this)[k].var] > (*this)[k].val]);
	return (*this)[k].y;
}

void tree::clear()
{
	for (node& n : *this)
	{
		n.samples.clear();
	}
}

float forest::predict(const array<float, tree::nv>& x) const
{
	float y = 0.0f;
	for (const tree& t : *this)
	{
		y += t.predict(x);
	}
	return y /= size();
}

void forest::clear()
{
	for (tree& t : *this)
	{
		t.clear();
	}
}
