#pragma once
#ifndef IDOCK_SUMMARY_HPP
#define IDOCK_SUMMARY_HPP

#include "conformation.hpp"

/// Represents a summary of docking results of a ligand.
class summary
{
public:
	size_t index;
	fl energy;
	fl efficiency;
	fl rfscore;
	string hbonds;
	conformation conf;
	explicit summary(const size_t index, const fl energy, const fl efficiency, const fl rfscore, string&& hbonds_, const conformation& conf) : index(index), energy(energy), efficiency(efficiency), rfscore(rfscore), hbonds(static_cast<string&&>(hbonds_)), conf(conf)
	{
	}

	fl consensus() const
	{
		return (rfscore + energy2pK * energy) * 0.5;
	}

	summary(const summary&) = default;
	summary(summary&&) = default;
	summary& operator=(const summary&) = default;
	summary& operator=(summary&&) = default;
};

/// For sorting ptr_vector<summary>.
inline bool operator<(const summary& a, const summary& b)
{
	return a.energy < b.energy;
}

#endif
