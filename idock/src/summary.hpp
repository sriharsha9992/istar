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

#include "common.hpp"

/// Represents a summary of docking results of a ligand.
class summary
{
public:
	size_t index;
	string lig_id;
	vector<fl> energies;
	vector<fl> efficiencies;
	vector<fl> rfscores;
	vector<fl> consensuses;
	vector<string> hbonds;
	string property;
	string supplier;
	explicit summary(const size_t index, const string& lig_id, vector<fl>&& energies_, vector<fl>&& efficiencies_, vector<fl>&& rfscores_, vector<string>&& hbonds_, string&& property_, string&& supplier_) : index(index), lig_id(lig_id), energies(static_cast<vector<fl>&&>(energies_)), efficiencies(static_cast<vector<fl>&&>(efficiencies_)), rfscores(static_cast<vector<fl>&&>(rfscores_)), hbonds(static_cast<vector<string>&&>(hbonds_)), property(static_cast<string&&>(property_)), supplier(static_cast<string&&>(supplier_))
	{
		const auto size = energies.size();
		consensuses.resize(size);
		for (size_t i = 0; i < size; ++i)
		{
			consensuses[i] = (rfscores[i] + energy2pK * energies[i]) * 0.5;
		}
	}

	summary(const summary&) = default;
	summary(summary&&) = default;
	summary& operator=(const summary&) = default;
	summary& operator=(summary&&) = default;
};

#endif
