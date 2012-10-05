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

namespace idock
{
	/// Represents a summary of docking results of a ligand.
	class summary
	{
	public:
		const size_t index;
		const string lig_id;
		const vector<fl> energies;
		const vector<string> hbonds;
		const string property;
		const string supplier;
		explicit summary(const size_t index, const string& lig_id, vector<fl>&& energies_, vector<string>&& hbonds_, string&& property_, string&& supplier_) : index(index), lig_id(lig_id), energies(static_cast<vector<fl>&&>(energies_)), hbonds(static_cast<vector<string>&&>(hbonds_)), property(static_cast<string&&>(property_)), supplier(static_cast<string&&>(supplier_)) {}
	};

	/// For sorting ptr_vector<summary>.
	inline bool operator<(const summary& a, const summary& b)
	{
		return a.energies.front() < b.energies.front();
	}
}

#endif
