/*

   Copyright (c) 2011, The Chinese University of Hong Kong

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
