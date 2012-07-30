#include <iostream>
#include <string>
#include <vector>
#include <boost/ptr_container/ptr_vector.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/fstream.hpp>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>

using std::string;
using std::vector;
using boost::ptr_vector;
using boost::filesystem::path;

class file_t
{
public:
	const string file;
	const string header;
	const size_t nucleotides;
	explicit file_t(const string& file, const string& header, const size_t nucleotides) : file(file), header(header), nucleotides(nucleotides) {}
};

class genome
{
public:
	const string organism, ncbiBuild, version, releaseDate;
	size_t nucleotides;
	vector<file_t> files;
	explicit genome(const string& organism, const string& ncbiBuild, const string& version, const string& releaseDate) : organism(organism), ncbiBuild(ncbiBuild), version(version), releaseDate(releaseDate), nucleotides(0) {}
};

inline bool operator<(const genome& a, const genome& b)
{
	return a.nucleotides > b.nucleotides;
}

int main(int argc, char* argv[])
{
	using std::cout;
	using std::cerr;
	using boost::filesystem::directory_iterator;
	using boost::filesystem::ifstream;
	using boost::iostreams::filtering_istream;
	using boost::iostreams::gzip_decompressor;

	const directory_iterator dir_iter;
	ptr_vector<genome> genomes(20);
	size_t index = 0;
	string line;
	for (directory_iterator di0(argv[1]); di0 != dir_iter; ++di0)
	{
		const path genome_path = di0->path();
		if (!is_directory(genome_path)) continue;
		cout << "Reading " << genome_path.filename() << '\n';

		// Parse README_CURRENT_BUILD
		ifstream in(genome_path / "README_CURRENT_BUILD");
		getline(in, line); // ======================================================================
		getline(in, line); // Organism: Apis mellifera (honey bee) 
		const auto organism = line.substr(10, line.size() - 11);
		getline(in, line); // NCBI Build Number: 5 
		const auto ncbiBuild = line.substr(19, line.size() - 20);
		getline(in, line); // Version: 1 
		const auto version = line.substr(9, line.size() - 10);
		getline(in, line); // Release date: 29 April 2011 
		const auto releaseDate = line.substr(14, line.size() - 15);
		genomes.push_back(new genome(organism, ncbiBuild, version, releaseDate));
		auto& g = genomes.back();

		// Sort *.fa.gz
		ptr_vector<string> files;
		files.reserve(20);
		for (directory_iterator di(genome_path); di != dir_iter; ++di)
		{
			const auto p = di->path();
			if (p.extension().string() != ".gz") continue;
			files.push_back(new string(p.filename().string()));
		}
		files.sort();

		// Parse *.fa.gz in the previously sorted order
		g.files.reserve(files.size());
		for (const auto& f : files)
		{
			ifstream in(genome_path / f);
			filtering_istream fis;
			fis.push(gzip_decompressor());
			fis.push(in);
			getline(fis, line); // Header line
			const auto header = line;
			size_t nucleotides = 0;
			while (getline(fis, line))
			{
				if ((line.front() == '>') || (line.size() > 70))
				{
					cerr << "Multiple header lines in " << f << '\n';
					return -1;
				}
				nucleotides += line.size();
			}
			g.files.push_back(file_t(f, header, nucleotides));
		}

		// Compute the overall nucleotides
		for (const auto& f : g.files) g.nucleotides += f.nucleotides;
	}

	// Sort genomes in the descending order of nucleotides
	genomes.sort();

	// Output genome construction code in javascript
	cout << "  var genomes = new Array(" << genomes.size() << ");\n";
	for (auto i = 0; i < genomes.size(); ++i)
	{
		const auto& g = genomes[i];
		cout << "  genomes[" << i << "] = {\n"
		     << "    name: '" << g.organism << "',\n"
		     << "    ncbiBuild: " << g.ncbiBuild << ",\n"
		     << "    version: " << g.version << ",\n"
		     << "    releaseDate: '" << g.releaseDate << "',\n"
		     << "    nucleotides: " << g.nucleotides << ",\n"
		     << "    files: [";
		for (auto i = 0; i < g.files.size(); ++i)
		{
			const auto& f = g.files[i];
			cout << "{\n"
			     << "      file: '" << f.file << "',\n"
			     << "      header: '" << f.header << "',\n"
			     << "      nucleotides: " << f.nucleotides << "\n"
			     << "    }";
			if (i < g.files.size() - 1) cout << ", "; else cout << "]\n";
		}
		cout << "  };\n";
	}
}
