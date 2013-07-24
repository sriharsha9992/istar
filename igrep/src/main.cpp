#include <iostream>
#include <sstream>
#include <vector>
#include <thread>
#include <boost/filesystem/operations.hpp>
#include <boost/filesystem/fstream.hpp>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#include <boost/date_time/posix_time/posix_time_types.hpp>
#include <cuda_runtime_api.h>
#include <helper_cuda.h>
#include <mongo/client/dbclient.h>
#include <Poco/Net/MailMessage.h>
#include <Poco/Net/MailRecipient.h>
#include <Poco/Net/SMTPClientSession.h>

using namespace std;
using namespace std::chrono;
using namespace boost::filesystem;
using namespace boost::iostreams;
using namespace boost::gregorian;
using namespace boost::posix_time;
using namespace mongo;
using namespace bson;
using namespace Poco::Net;

#define CHARACTER_CARDINALITY 4	/**< One nucleotide is either A, C, G, or T. */
#define MAX_UNSIGNED_INT	0xffffffffUL	/**< The maximum value of an unsigned int. */
#define MAX_UNSIGNED_LONG_LONG	0xffffffffffffffffULL	/**< The maximum value of an unsigned long long. */
#define B 7	/**< Each thread block consists of 2^B (=1<<B) threads. */
#define L 8	/**< Each thread processes 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads. */
// Since each thread block processes 1 << (L + B) special codons, the number of thread blocks will be up to (MAX_SCODON_COUNT + 1 << (L + B) - 1) >> (L + B).
// This program uses 1D CUDA thread organization, so at most 65,536 threads can be specified.
// Therefore, the inequation ((MAX_SCODON_COUNT + (1 << (L + B)) - 1) >> (L + B)) <= 65,536 must hold.
// MAX_SCODON_COUNT = 0.22G ==> L + B >= 12 is required.

/**
 * Transfer necessary parameters to CUDA constant memory.
 * This agrep kernel initialization should be called only once for searching the same corpus.
 * @param[in] scodon_arg The special codon array.
 * @param[in] character_count_arg Actual number of characters.
 * @param[in] match_arg The match array.
 * @param[in] max_match_count_arg Maximum number of matches of one single query.
 */
extern "C" void initAgrepKernel(const unsigned int *scodon_arg, const unsigned int character_count_arg, const unsigned int *match_arg, const unsigned int max_match_count_arg);

/**
 * Transfer 32-bit mask array and test bit from host to CUDA constant memory.
 * @param[in] mask_array_arg The mask array of a pattern.
 * @param[in] test_bit_arg The test bit.
 */
extern "C" void transferMaskArray32(const unsigned int *mask_array_arg, const unsigned int test_bit_arg);

/**
 * Transfer 64-bit mask array and test bit from host to CUDA constant memory.
 * @param[in] mask_array_arg The mask array of a pattern.
 * @param[in] test_bit_arg The test bit.
 */
extern "C" void transferMaskArray64(const unsigned long long *mask_array_arg, const unsigned long long test_bit_arg);

/**
 * Invoke the CUDA implementation of agrep kernel.
 * @param[in] m Pattern length.
 * @param[in] k Edit distance.
 * @param[in] block_count Number of thread blocks.
 */
extern "C" void invokeAgrepKernel(const unsigned int m, const unsigned int k, const unsigned int block_count);

/**
 * Get the number of matches from CUDA constant memory.
 * @param[out] match_count_arg Number of matches.
 */
extern "C" void getMatchCount(unsigned int *match_count_arg);

/**
 * Encode a character to its 2-bit binary representation.
 * The last two but one bits are different for A, C, G, and T respectively.
 * Note that some genomes contain 'N', which will be treated as 'G' in this encoding function.
 *
 * 'A' = 65 = 01000<b>00</b>1
 *
 * 'C' = 67 = 01000<b>01</b>1
 *
 * 'G' = 71 = 01000<b>11</b>1
 *
 * 'N' = 78 = 01001<b>11</b>0
 *
 * 'T' = 84 = 01010<b>10</b>0
 * @param[in] character The character to be encoded.
 * @return The 2-bit binary representation of given character.
 */
inline unsigned int encode(char character)
{
	return (toupper(character) >> 1) & 3;
}

/// Represents a genome in FASTA format.
class genome
{
public:
	const unsigned int taxid;	/**< taxidomy ID. */
	string name;	/**< Genome name. */
	const unsigned int sequence_count;	/**< Actual number of sequences. */
	const unsigned int character_count;	/**< Actual number of characters. */
	vector<unsigned int> sequence_length;	/**< Lengthes of sequences. */
	vector<unsigned int> sequence_cumulative_length;	/**< Cumulative lengths of sequences, i.e. 1) sequence_cumulative_length[0] = 0; 2) sequence_cumulative_length[sequence_index + 1] = sequence_cumulative_length[sequence_index] + sequence_length[sequence_index]; */
	const unsigned int scodon_count;	/**< Actual number of special codons. */
	const unsigned int block_count;	/**< Actual number of thread blocks. */
	vector<unsigned int> scodon;	/**< The entire genomic nucleotides are stored into this array, one element of which, i.e. one 32-bit unsigned int, can store up to 16 nucleotides because one nucleotide can be uniquely represented by two bits since it must be either A, C, G, or T. One unsigned int is called a special codon, or scodon for short, because it is similar to codon, in which three consecutive characters of mRNA determine one amino acid of resulting protein. */
	vector<unsigned int> block_to_sequence;	/**< Mapping of thread blocks to sequences. */

	/**
	 * Construct a genome by loading its FASTA files.
	 * @param[in] taxid taxidomy ID, e.g. 9606 for human.
	 * @param[in] name Scientific name followed by common name in brackets, e.g. Homo sapiens (Human).
	 * @param[in] sequence_count Number of sequences. For assembled genomes, it equals the number of FASTA files.
	 * @param[in] character_count Number of characters.
	 * @param[in] files Fasta files;
	 */
	explicit genome(const unsigned int taxid, const string name, const unsigned int character_count, const vector<string>&& files) :
		taxid(taxid),
		name(name),
		sequence_count(files.size()),
		character_count(character_count),
		sequence_length(sequence_count),
		sequence_cumulative_length(sequence_count + 1),
		scodon_count((character_count + 16 - 1) >> 4),
		block_count((scodon_count + (1 << (L + B)) - 1) >> (L + B)),
		scodon(block_count << (L + B)),
		block_to_sequence(block_count)
	{
		sequence_cumulative_length[0] = 0;

		cout << "Loading the genome of " << name << endl;
		unsigned int scodon_buffer = 0;	// 16 consecutive characters will be accommodated into one 32-bit unsigned int.
		unsigned int scodon_index;	// scodon[scodon_index] = scodon_buffer; In CUDA implementation, special codons need to be properly shuffled in order to satisfy coalesced global memory access.
		int sequence_index = -1;	// Index of the current sequence.
		unsigned int character_index = 0;	// Index of the current character across all the sequences of the entire genome.
		string line;
		line.reserve(1000);
		const path genome_path = name;
		for (const auto& file : files)
		{
			boost::filesystem::ifstream ifs(genome_path / file);
			filtering_istream fis;
			fis.push(gzip_decompressor());
			fis.push(ifs);
			while (getline(fis, line))
			{
				if (line.front() == '>') // Header line.
				{
					if (++sequence_index) // Not the first sequence.
					{
						sequence_cumulative_length[sequence_index] = character_index;
						sequence_length[sequence_index - 1] = character_index - sequence_cumulative_length[sequence_index - 1];
					}
				}
				else
				{
					for (const auto c : line)
					{
						const unsigned int character_index_lowest_four_bits = character_index & 15;
						scodon_buffer |= encode(c) << (character_index_lowest_four_bits << 1); // Earlier characters reside in lower bits, while later characters reside in higher bits.
						if (character_index_lowest_four_bits == 15) // The buffer is full. Flush it to the special codon array. Note that there is no need to clear scodon_buffer.
						{
							scodon_index = character_index >> 4;
							// scodon_index can be splitted into 3 parts:
							// scodon_index = block_index << (L + B) | thread_index << L | scodon_index;
							// because 1) each thread block processes 1 << (L + B) special codons,
							//     and 2) each thread processes 1 << L special codons.
							// The scodon_index is accommodated in the lowest L bits.
							// The thread_index is accommodated in the middle B bits.
							// The block_index  is accommodated in the highest 32 - (L + B) bits.
							// This program uses 1D CUDA thread organization, so at most 65,536 threads can be specified, i.e. at least 16 bits should be reserved for block_index.
							// Therefore, the inequation 32 - (L + B) >= 16 must hold. ==> L + B <= 16.
							// In order to satisfy coalesced global memory access, thread_index should be rearranged to the lowest B bits.
							// To achieve this goal,
							//         1) block_index remains at the highest 32 - (L + B) bits,
							//   while 2) thread_index should be rearranged to the lowest B bits,
							//     and 3) scodon_index should be rearranged to the middle L bits.
							// Finally, scodon_index = block_index << (L + B) | scodon_index << B | thread_index;
							scodon_index = (scodon_index & (MAX_UNSIGNED_INT ^ ((1 << (L + B)) - 1)))
										 | ((scodon_index & ((1 << L) - 1)) << B)
										 | ((scodon_index >> L) & ((1 << B) - 1));
							scodon[scodon_index] = scodon_buffer;
							scodon_buffer = 0;
						}
						++character_index;
					}
				}
			}
		}
		BOOST_ASSERT(character_count == character_index);
		BOOST_ASSERT(sequence_count == sequence_index + 1);

		// Calculate statistics.
		sequence_cumulative_length[sequence_count] = character_count;
		sequence_length[sequence_index] = character_count - sequence_cumulative_length[sequence_index];
		scodon_index = character_index >> 4;
		if (scodon_index < scodon_count)	// There are some nucleotides in the special codon buffer, flush it.
		{
			scodon_index = (scodon_index & (MAX_UNSIGNED_INT ^ ((1 << (L + B)) - 1)))
						 | ((scodon_index & ((1 << L) - 1)) << B)
						 | ((scodon_index >> L) & ((1 << B) - 1));
			scodon[scodon_index] = scodon_buffer; // Now the last special codon might have zeros in its least significant bits. Don't treat such zeros as 'A's.
		}

		// Calculate thread block to sequence index mapping.
		for (unsigned int block = 0, character = 0, sequence = 0; block < block_count; ++block)
		{
			while (character >= sequence_cumulative_length[sequence + 1]) ++sequence;
			block_to_sequence[block] = sequence;
			character += (1 << (L + B + 4)); // One thread block processes 1 << (L + B) special codons, and each special codon encodes 1 << 4 characters.
		}
	}

	/// Default copy constructor.
	genome(const genome&) = default;
	/// Default move constructor.
	genome(genome&&) = default;
	/// Default copy assignment operator.
	genome& operator=(const genome&) = default;
	/// Default move assignment operator.
	genome& operator=(genome&&) = default;
};

int main(int argc, char** argv)
{
	// Fetch command line arguments.
	const auto host = argv[1];
	const auto user = argv[2];
	const auto pwd = argv[3];
	const path jobs_path = argv[4];

	DBClientConnection conn;
	{
		// Connect to host and authenticate user.
		cout << "Connecting to " << host << " and authenticating " << user << endl;
		string errmsg;
		if ((!conn.connect(host, errmsg)) || (!conn.auth("istar", user, pwd, errmsg)))
		{
			cerr << errmsg << endl;
			return 1;
		}
	}
	const auto collection = "istar.igrep";

	// Initialize genomes.
	vector<genome> genomes;
	genomes.reserve(26);
	genomes.push_back(genome(13616, "Monodelphis domestica (opossum)", 3502390117, { "mdm_ref_MonDom5_chr1.fa.gz", "mdm_ref_MonDom5_chr2.fa.gz", "mdm_ref_MonDom5_chr3.fa.gz", "mdm_ref_MonDom5_chr4.fa.gz", "mdm_ref_MonDom5_chr5.fa.gz", "mdm_ref_MonDom5_chr6.fa.gz", "mdm_ref_MonDom5_chr7.fa.gz", "mdm_ref_MonDom5_chr8.fa.gz", "mdm_ref_MonDom5_chrX.fa.gz", "mdm_ref_MonDom5_chrMT.fa.gz" }));
	genomes.push_back(genome(9598, "Pan troglodytes (chimpanzee)", 3160370125, { "ptr_ref_Pan_troglodytes-2.1.4_chr1.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr2A.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr2B.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr3.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr4.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr5.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr6.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr7.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr8.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr9.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr10.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr11.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr12.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr13.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr14.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr15.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr16.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr17.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr18.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr19.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr20.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr21.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chr22.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chrX.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chrY.fa.gz", "ptr_ref_Pan_troglodytes-2.1.4_chrMT.fa.gz" }));
	genomes.push_back(genome(9606, "Homo sapiens (human)", 3095693981, { "hs_ref_GRCh37.p5_chr1.fa.gz", "hs_ref_GRCh37.p5_chr2.fa.gz", "hs_ref_GRCh37.p5_chr3.fa.gz", "hs_ref_GRCh37.p5_chr4.fa.gz", "hs_ref_GRCh37.p5_chr5.fa.gz", "hs_ref_GRCh37.p5_chr6.fa.gz", "hs_ref_GRCh37.p5_chr7.fa.gz", "hs_ref_GRCh37.p5_chr8.fa.gz", "hs_ref_GRCh37.p5_chr9.fa.gz", "hs_ref_GRCh37.p5_chr10.fa.gz", "hs_ref_GRCh37.p5_chr11.fa.gz", "hs_ref_GRCh37.p5_chr12.fa.gz", "hs_ref_GRCh37.p5_chr13.fa.gz", "hs_ref_GRCh37.p5_chr14.fa.gz", "hs_ref_GRCh37.p5_chr15.fa.gz", "hs_ref_GRCh37.p5_chr16.fa.gz", "hs_ref_GRCh37.p5_chr17.fa.gz", "hs_ref_GRCh37.p5_chr18.fa.gz", "hs_ref_GRCh37.p5_chr19.fa.gz", "hs_ref_GRCh37.p5_chr20.fa.gz", "hs_ref_GRCh37.p5_chr21.fa.gz", "hs_ref_GRCh37.p5_chr22.fa.gz", "hs_ref_GRCh37.p5_chrX.fa.gz", "hs_ref_GRCh37.p5_chrY.fa.gz", "hs_ref_GRCh37.p5_chrMT.fa.gz" }));
	genomes.push_back(genome(9601, "Pongo abelii (Sumatran orangutan)", 3029507528, { "pab_ref_P_pygmaeus_2.0.2_chr1.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr2A.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr2B.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr3.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr4.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr5.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr6.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr7.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr8.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr9.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr10.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr11.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr12.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr13.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr14.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr15.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr16.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr17.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr18.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr19.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr20.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr21.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chr22.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chrX.fa.gz", "pab_ref_P_pygmaeus_2.0.2_chrMT.fa.gz" }));
	genomes.push_back(genome(10116, "Rattus norvegicus (rat)", 2902605281, { "rn_ref_Rnor_5.0_chr1.fa.gz", "rn_ref_Rnor_5.0_chr2.fa.gz", "rn_ref_Rnor_5.0_chr3.fa.gz", "rn_ref_Rnor_5.0_chr4.fa.gz", "rn_ref_Rnor_5.0_chr5.fa.gz", "rn_ref_Rnor_5.0_chr6.fa.gz", "rn_ref_Rnor_5.0_chr7.fa.gz", "rn_ref_Rnor_5.0_chr8.fa.gz", "rn_ref_Rnor_5.0_chr9.fa.gz", "rn_ref_Rnor_5.0_chr10.fa.gz", "rn_ref_Rnor_5.0_chr11.fa.gz", "rn_ref_Rnor_5.0_chr12.fa.gz", "rn_ref_Rnor_5.0_chr13.fa.gz", "rn_ref_Rnor_5.0_chr14.fa.gz", "rn_ref_Rnor_5.0_chr15.fa.gz", "rn_ref_Rnor_5.0_chr16.fa.gz", "rn_ref_Rnor_5.0_chr17.fa.gz", "rn_ref_Rnor_5.0_chr18.fa.gz", "rn_ref_Rnor_5.0_chr19.fa.gz", "rn_ref_Rnor_5.0_chr20.fa.gz", "rn_ref_Rnor_5.0_chrX.fa.gz", "rn_ref_Rnor_5.0_chrMT.fa.gz" }));
	genomes.push_back(genome(9544, "Macaca mulatta (rhesus monkey)", 2863681749, { "mmu_ref_Mmul_051212_chr1.fa.gz", "mmu_ref_Mmul_051212_chr2.fa.gz", "mmu_ref_Mmul_051212_chr3.fa.gz", "mmu_ref_Mmul_051212_chr4.fa.gz", "mmu_ref_Mmul_051212_chr5.fa.gz", "mmu_ref_Mmul_051212_chr6.fa.gz", "mmu_ref_Mmul_051212_chr7.fa.gz", "mmu_ref_Mmul_051212_chr8.fa.gz", "mmu_ref_Mmul_051212_chr9.fa.gz", "mmu_ref_Mmul_051212_chr10.fa.gz", "mmu_ref_Mmul_051212_chr11.fa.gz", "mmu_ref_Mmul_051212_chr12.fa.gz", "mmu_ref_Mmul_051212_chr13.fa.gz", "mmu_ref_Mmul_051212_chr14.fa.gz", "mmu_ref_Mmul_051212_chr15.fa.gz", "mmu_ref_Mmul_051212_chr16.fa.gz", "mmu_ref_Mmul_051212_chr17.fa.gz", "mmu_ref_Mmul_051212_chr18.fa.gz", "mmu_ref_Mmul_051212_chr19.fa.gz", "mmu_ref_Mmul_051212_chr20.fa.gz", "mmu_ref_Mmul_051212_chrX.fa.gz", "mmu_chrMT.fa.gz" }));
	genomes.push_back(genome(9483, "Callithrix jacchus (marmoset)", 2770219215, { "cja_ref_Callithrix_jacchus-3.2_chr1.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr2.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr3.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr4.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr5.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr6.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr7.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr8.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr9.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr10.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr11.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr12.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr13.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr14.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr15.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr16.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr17.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr18.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr19.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr20.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr21.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chr22.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chrX.fa.gz", "cja_ref_Callithrix_jacchus-3.2_chrY.fa.gz" }));
	genomes.push_back(genome(10090, "Mus musculus (mouse)", 2725537669, { "mm_ref_GRCm38_chr1.fa.gz", "mm_ref_GRCm38_chr2.fa.gz", "mm_ref_GRCm38_chr3.fa.gz", "mm_ref_GRCm38_chr4.fa.gz", "mm_ref_GRCm38_chr5.fa.gz", "mm_ref_GRCm38_chr6.fa.gz", "mm_ref_GRCm38_chr7.fa.gz", "mm_ref_GRCm38_chr8.fa.gz", "mm_ref_GRCm38_chr9.fa.gz", "mm_ref_GRCm38_chr10.fa.gz", "mm_ref_GRCm38_chr11.fa.gz", "mm_ref_GRCm38_chr12.fa.gz", "mm_ref_GRCm38_chr13.fa.gz", "mm_ref_GRCm38_chr14.fa.gz", "mm_ref_GRCm38_chr15.fa.gz", "mm_ref_GRCm38_chr16.fa.gz", "mm_ref_GRCm38_chr17.fa.gz", "mm_ref_GRCm38_chr18.fa.gz", "mm_ref_GRCm38_chr19.fa.gz", "mm_ref_GRCm38_chrX.fa.gz", "mm_ref_GRCm38_chrY.fa.gz", "mm_ref_GRCm38_chrMT.fa.gz" }));
	genomes.push_back(genome(9913, "Bos taurus (cow)", 2660922743, { "bt_ref_Bos_taurus_UMD_3.1_chr1.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr2.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr3.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr4.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr5.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr6.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr7.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr8.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr9.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr10.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr11.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr12.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr13.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr14.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr15.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr16.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr17.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr18.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr19.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr20.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr21.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr22.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr23.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr24.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr25.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr26.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr27.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr28.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chr29.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chrX.fa.gz", "bt_ref_Bos_taurus_UMD_3.1_chrMT.fa.gz" }));
	genomes.push_back(genome(9823, "Sus scrofa (pig)", 2596656069, { "ssc_ref_Sscrofa10.2_chr1.fa.gz", "ssc_ref_Sscrofa10.2_chr2.fa.gz", "ssc_ref_Sscrofa10.2_chr3.fa.gz", "ssc_ref_Sscrofa10.2_chr4.fa.gz", "ssc_ref_Sscrofa10.2_chr5.fa.gz", "ssc_ref_Sscrofa10.2_chr6.fa.gz", "ssc_ref_Sscrofa10.2_chr7.fa.gz", "ssc_ref_Sscrofa10.2_chr8.fa.gz", "ssc_ref_Sscrofa10.2_chr9.fa.gz", "ssc_ref_Sscrofa10.2_chr10.fa.gz", "ssc_ref_Sscrofa10.2_chr11.fa.gz", "ssc_ref_Sscrofa10.2_chr12.fa.gz", "ssc_ref_Sscrofa10.2_chr13.fa.gz", "ssc_ref_Sscrofa10.2_chr14.fa.gz", "ssc_ref_Sscrofa10.2_chr15.fa.gz", "ssc_ref_Sscrofa10.2_chr16.fa.gz", "ssc_ref_Sscrofa10.2_chr17.fa.gz", "ssc_ref_Sscrofa10.2_chr18.fa.gz", "ssc_ref_Sscrofa10.2_chrX.fa.gz", "ssc_ref_Sscrofa10.2_chrY.fa.gz", "ssc_ref_Sscrofa10.2_chrMT.fa.gz" }));
	genomes.push_back(genome(9796, "Equus caballus (horse)", 2367070107, { "eca_ref_EquCab2.0_chr1.fa.gz", "eca_ref_EquCab2.0_chr2.fa.gz", "eca_ref_EquCab2.0_chr3.fa.gz", "eca_ref_EquCab2.0_chr4.fa.gz", "eca_ref_EquCab2.0_chr5.fa.gz", "eca_ref_EquCab2.0_chr6.fa.gz", "eca_ref_EquCab2.0_chr7.fa.gz", "eca_ref_EquCab2.0_chr8.fa.gz", "eca_ref_EquCab2.0_chr9.fa.gz", "eca_ref_EquCab2.0_chr10.fa.gz", "eca_ref_EquCab2.0_chr11.fa.gz", "eca_ref_EquCab2.0_chr12.fa.gz", "eca_ref_EquCab2.0_chr13.fa.gz", "eca_ref_EquCab2.0_chr14.fa.gz", "eca_ref_EquCab2.0_chr15.fa.gz", "eca_ref_EquCab2.0_chr16.fa.gz", "eca_ref_EquCab2.0_chr17.fa.gz", "eca_ref_EquCab2.0_chr18.fa.gz", "eca_ref_EquCab2.0_chr19.fa.gz", "eca_ref_EquCab2.0_chr20.fa.gz", "eca_ref_EquCab2.0_chr21.fa.gz", "eca_ref_EquCab2.0_chr22.fa.gz", "eca_ref_EquCab2.0_chr23.fa.gz", "eca_ref_EquCab2.0_chr24.fa.gz", "eca_ref_EquCab2.0_chr25.fa.gz", "eca_ref_EquCab2.0_chr26.fa.gz", "eca_ref_EquCab2.0_chr27.fa.gz", "eca_ref_EquCab2.0_chr28.fa.gz", "eca_ref_EquCab2.0_chr29.fa.gz", "eca_ref_EquCab2.0_chr30.fa.gz", "eca_ref_EquCab2.0_chr31.fa.gz", "eca_ref_EquCab2.0_chrX.fa.gz", "eca_ref_EquCab2.0_chrMT.fa.gz" }));
	genomes.push_back(genome(9615, "Canis lupus familiaris (dog)", 2327650711, { "cfa_ref_CanFam3.1_chr1.fa.gz", "cfa_ref_CanFam3.1_chr2.fa.gz", "cfa_ref_CanFam3.1_chr3.fa.gz", "cfa_ref_CanFam3.1_chr4.fa.gz", "cfa_ref_CanFam3.1_chr5.fa.gz", "cfa_ref_CanFam3.1_chr6.fa.gz", "cfa_ref_CanFam3.1_chr7.fa.gz", "cfa_ref_CanFam3.1_chr8.fa.gz", "cfa_ref_CanFam3.1_chr9.fa.gz", "cfa_ref_CanFam3.1_chr10.fa.gz", "cfa_ref_CanFam3.1_chr11.fa.gz", "cfa_ref_CanFam3.1_chr12.fa.gz", "cfa_ref_CanFam3.1_chr13.fa.gz", "cfa_ref_CanFam3.1_chr14.fa.gz", "cfa_ref_CanFam3.1_chr15.fa.gz", "cfa_ref_CanFam3.1_chr16.fa.gz", "cfa_ref_CanFam3.1_chr17.fa.gz", "cfa_ref_CanFam3.1_chr18.fa.gz", "cfa_ref_CanFam3.1_chr19.fa.gz", "cfa_ref_CanFam3.1_chr20.fa.gz", "cfa_ref_CanFam3.1_chr21.fa.gz", "cfa_ref_CanFam3.1_chr22.fa.gz", "cfa_ref_CanFam3.1_chr23.fa.gz", "cfa_ref_CanFam3.1_chr24.fa.gz", "cfa_ref_CanFam3.1_chr25.fa.gz", "cfa_ref_CanFam3.1_chr26.fa.gz", "cfa_ref_CanFam3.1_chr27.fa.gz", "cfa_ref_CanFam3.1_chr28.fa.gz", "cfa_ref_CanFam3.1_chr29.fa.gz", "cfa_ref_CanFam3.1_chr30.fa.gz", "cfa_ref_CanFam3.1_chr31.fa.gz", "cfa_ref_CanFam3.1_chr32.fa.gz", "cfa_ref_CanFam3.1_chr33.fa.gz", "cfa_ref_CanFam3.1_chr34.fa.gz", "cfa_ref_CanFam3.1_chr35.fa.gz", "cfa_ref_CanFam3.1_chr36.fa.gz", "cfa_ref_CanFam3.1_chr37.fa.gz", "cfa_ref_CanFam3.1_chr38.fa.gz", "cfa_ref_CanFam3.1_chrX.fa.gz", "cfa_ref_CanFam3.1_chrMT.fa.gz" }));
	genomes.push_back(genome(9986, "Oryctolagus cuniculus (rabbit)", 2247769349, { "ocu_ref_OryCun2.0_chr1.fa.gz", "ocu_ref_OryCun2.0_chr2.fa.gz", "ocu_ref_OryCun2.0_chr3.fa.gz", "ocu_ref_OryCun2.0_chr4.fa.gz", "ocu_ref_OryCun2.0_chr5.fa.gz", "ocu_ref_OryCun2.0_chr6.fa.gz", "ocu_ref_OryCun2.0_chr7.fa.gz", "ocu_ref_OryCun2.0_chr8.fa.gz", "ocu_ref_OryCun2.0_chr9.fa.gz", "ocu_ref_OryCun2.0_chr10.fa.gz", "ocu_ref_OryCun2.0_chr11.fa.gz", "ocu_ref_OryCun2.0_chr12.fa.gz", "ocu_ref_OryCun2.0_chr13.fa.gz", "ocu_ref_OryCun2.0_chr14.fa.gz", "ocu_ref_OryCun2.0_chr15.fa.gz", "ocu_ref_OryCun2.0_chr16.fa.gz", "ocu_ref_OryCun2.0_chr17.fa.gz", "ocu_ref_OryCun2.0_chr18.fa.gz", "ocu_ref_OryCun2.0_chr19.fa.gz", "ocu_ref_OryCun2.0_chr20.fa.gz", "ocu_ref_OryCun2.0_chr21.fa.gz", "ocu_ref_OryCun2.0_chrX.fa.gz", "ocu_chrMT.fa.gz" }));
	genomes.push_back(genome(7955, "Danio rerio (zebrafish)", 1357051643, { "dr_ref_Zv9_chr1.fa.gz", "dr_ref_Zv9_chr2.fa.gz", "dr_ref_Zv9_chr3.fa.gz", "dr_ref_Zv9_chr4.fa.gz", "dr_ref_Zv9_chr5.fa.gz", "dr_ref_Zv9_chr6.fa.gz", "dr_ref_Zv9_chr7.fa.gz", "dr_ref_Zv9_chr8.fa.gz", "dr_ref_Zv9_chr9.fa.gz", "dr_ref_Zv9_chr10.fa.gz", "dr_ref_Zv9_chr11.fa.gz", "dr_ref_Zv9_chr12.fa.gz", "dr_ref_Zv9_chr13.fa.gz", "dr_ref_Zv9_chr14.fa.gz", "dr_ref_Zv9_chr15.fa.gz", "dr_ref_Zv9_chr16.fa.gz", "dr_ref_Zv9_chr17.fa.gz", "dr_ref_Zv9_chr18.fa.gz", "dr_ref_Zv9_chr19.fa.gz", "dr_ref_Zv9_chr20.fa.gz", "dr_ref_Zv9_chr21.fa.gz", "dr_ref_Zv9_chr22.fa.gz", "dr_ref_Zv9_chr23.fa.gz", "dr_ref_Zv9_chr24.fa.gz", "dr_ref_Zv9_chr25.fa.gz", "dr_ref_Zv9_chrMT.fa.gz" }));
	genomes.push_back(genome(28377, "Anolis carolinensis (green anole)", 1081661814, { "acr_ref_AnoCar2.0_chr1.fa.gz", "acr_ref_AnoCar2.0_chr2.fa.gz", "acr_ref_AnoCar2.0_chr3.fa.gz", "acr_ref_AnoCar2.0_chr4.fa.gz", "acr_ref_AnoCar2.0_chr5.fa.gz", "acr_ref_AnoCar2.0_chr6.fa.gz", "acr_ref_AnoCar2.0_chra.fa.gz", "acr_ref_AnoCar2.0_chrb.fa.gz", "acr_ref_AnoCar2.0_chrc.fa.gz", "acr_ref_AnoCar2.0_chrd.fa.gz", "acr_ref_AnoCar2.0_chrf.fa.gz", "acr_ref_AnoCar2.0_chrg.fa.gz", "acr_ref_AnoCar2.0_chrh.fa.gz", "acr_ref_AnoCar2.0_chrMT.fa.gz" }));
	genomes.push_back(genome(9103, "Meleagris gallopavo (turkey)", 1040303789, { "mga_ref_Turkey_2.01_chr1.fa.gz", "mga_ref_Turkey_2.01_chr2.fa.gz", "mga_ref_Turkey_2.01_chr3.fa.gz", "mga_ref_Turkey_2.01_chr4.fa.gz", "mga_ref_Turkey_2.01_chr5.fa.gz", "mga_ref_Turkey_2.01_chr6.fa.gz", "mga_ref_Turkey_2.01_chr7.fa.gz", "mga_ref_Turkey_2.01_chr8.fa.gz", "mga_ref_Turkey_2.01_chr9.fa.gz", "mga_ref_Turkey_2.01_chr10.fa.gz", "mga_ref_Turkey_2.01_chr11.fa.gz", "mga_ref_Turkey_2.01_chr12.fa.gz", "mga_ref_Turkey_2.01_chr13.fa.gz", "mga_ref_Turkey_2.01_chr14.fa.gz", "mga_ref_Turkey_2.01_chr15.fa.gz", "mga_ref_Turkey_2.01_chr16.fa.gz", "mga_ref_Turkey_2.01_chr17.fa.gz", "mga_ref_Turkey_2.01_chr18.fa.gz", "mga_ref_Turkey_2.01_chr19.fa.gz", "mga_ref_Turkey_2.01_chr20.fa.gz", "mga_ref_Turkey_2.01_chr21.fa.gz", "mga_ref_Turkey_2.01_chr22.fa.gz", "mga_ref_Turkey_2.01_chr23.fa.gz", "mga_ref_Turkey_2.01_chr24.fa.gz", "mga_ref_Turkey_2.01_chr25.fa.gz", "mga_ref_Turkey_2.01_chr26.fa.gz", "mga_ref_Turkey_2.01_chr27.fa.gz", "mga_ref_Turkey_2.01_chr28.fa.gz", "mga_ref_Turkey_2.01_chr29.fa.gz", "mga_ref_Turkey_2.01_chr30.fa.gz", "mga_ref_Turkey_2.01_chrW.fa.gz", "mga_ref_Turkey_2.01_chrZ.fa.gz", "mga_ref_Turkey_2.01_chrMT.fa.gz" }));
	genomes.push_back(genome(59729, "Taeniopygia guttata (Zebra finch)", 1021462940, { "tgu_ref_chr1.fa.gz", "tgu_ref_chr1A.fa.gz", "tgu_ref_chr1B.fa.gz", "tgu_ref_chr2.fa.gz", "tgu_ref_chr3.fa.gz", "tgu_ref_chr4.fa.gz", "tgu_ref_chr4A.fa.gz", "tgu_ref_chr5.fa.gz", "tgu_ref_chr6.fa.gz", "tgu_ref_chr7.fa.gz", "tgu_ref_chr8.fa.gz", "tgu_ref_chr9.fa.gz", "tgu_ref_chr10.fa.gz", "tgu_ref_chr11.fa.gz", "tgu_ref_chr12.fa.gz", "tgu_ref_chr13.fa.gz", "tgu_ref_chr14.fa.gz", "tgu_ref_chr15.fa.gz", "tgu_ref_chr16.fa.gz", "tgu_ref_chr17.fa.gz", "tgu_ref_chr18.fa.gz", "tgu_ref_chr19.fa.gz", "tgu_ref_chr20.fa.gz", "tgu_ref_chr21.fa.gz", "tgu_ref_chr22.fa.gz", "tgu_ref_chr23.fa.gz", "tgu_ref_chr24.fa.gz", "tgu_ref_chr25.fa.gz", "tgu_ref_chr26.fa.gz", "tgu_ref_chr27.fa.gz", "tgu_ref_chr28.fa.gz", "tgu_ref_chrZ.fa.gz", "tgu_ref_chrLG2.fa.gz", "tgu_ref_chrLG5.fa.gz", "tgu_ref_chrLGE22.fa.gz" }));
	genomes.push_back(genome(9031, "Gallus gallus (chicken)", 1004818361, { "gga_ref_Gallus_gallus-4.0_chr1.fa.gz", "gga_ref_Gallus_gallus-4.0_chr2.fa.gz", "gga_ref_Gallus_gallus-4.0_chr3.fa.gz", "gga_ref_Gallus_gallus-4.0_chr4.fa.gz", "gga_ref_Gallus_gallus-4.0_chr5.fa.gz", "gga_ref_Gallus_gallus-4.0_chr6.fa.gz", "gga_ref_Gallus_gallus-4.0_chr7.fa.gz", "gga_ref_Gallus_gallus-4.0_chr8.fa.gz", "gga_ref_Gallus_gallus-4.0_chr9.fa.gz", "gga_ref_Gallus_gallus-4.0_chr10.fa.gz", "gga_ref_Gallus_gallus-4.0_chr11.fa.gz", "gga_ref_Gallus_gallus-4.0_chr12.fa.gz", "gga_ref_Gallus_gallus-4.0_chr13.fa.gz", "gga_ref_Gallus_gallus-4.0_chr14.fa.gz", "gga_ref_Gallus_gallus-4.0_chr15.fa.gz", "gga_ref_Gallus_gallus-4.0_chr16.fa.gz", "gga_ref_Gallus_gallus-4.0_chr17.fa.gz", "gga_ref_Gallus_gallus-4.0_chr18.fa.gz", "gga_ref_Gallus_gallus-4.0_chr19.fa.gz", "gga_ref_Gallus_gallus-4.0_chr20.fa.gz", "gga_ref_Gallus_gallus-4.0_chr21.fa.gz", "gga_ref_Gallus_gallus-4.0_chr22.fa.gz", "gga_ref_Gallus_gallus-4.0_chr23.fa.gz", "gga_ref_Gallus_gallus-4.0_chr24.fa.gz", "gga_ref_Gallus_gallus-4.0_chr25.fa.gz", "gga_ref_Gallus_gallus-4.0_chr26.fa.gz", "gga_ref_Gallus_gallus-4.0_chr27.fa.gz", "gga_ref_Gallus_gallus-4.0_chr28.fa.gz", "gga_ref_Gallus_gallus-4.0_chr32.fa.gz", "gga_ref_Gallus_gallus-4.0_chrW.fa.gz", "gga_ref_Gallus_gallus-4.0_chrZ.fa.gz", "gga_ref_Gallus_gallus-4.0_chrLGE22C19W28_E50C23.fa.gz", "gga_ref_Gallus_gallus-4.0_chrLGE64.fa.gz", "gga_ref_Gallus_gallus-4.0_chrMT.fa.gz" }));
	genomes.push_back(genome(3847, "Glycine max (soybean)", 950221025, { "gma_ref_V1.0_chr1.fa.gz", "gma_ref_V1.0_chr2.fa.gz", "gma_ref_V1.0_chr3.fa.gz", "gma_ref_V1.0_chr4.fa.gz", "gma_ref_V1.0_chr5.fa.gz", "gma_ref_V1.0_chr6.fa.gz", "gma_ref_V1.0_chr7.fa.gz", "gma_ref_V1.0_chr8.fa.gz", "gma_ref_V1.0_chr9.fa.gz", "gma_ref_V1.0_chr10.fa.gz", "gma_ref_V1.0_chr11.fa.gz", "gma_ref_V1.0_chr12.fa.gz", "gma_ref_V1.0_chr13.fa.gz", "gma_ref_V1.0_chr14.fa.gz", "gma_ref_V1.0_chr15.fa.gz", "gma_ref_V1.0_chr16.fa.gz", "gma_ref_V1.0_chr17.fa.gz", "gma_ref_V1.0_chr18.fa.gz", "gma_ref_V1.0_chr19.fa.gz", "gma_ref_V1.0_chr20.fa.gz", "gma_ref_V1.0_chrPltd.fa.gz" }));
	genomes.push_back(genome(9258, "Ornithorhynchus anatinus (platypus)", 437097043, { "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr1.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr2.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr3.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr4.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr5.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr6.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr7.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr10.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr11.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr12.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr14.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr15.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr17.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr18.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chr20.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX1.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX2.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX3.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chrX5.fa.gz", "oan_ref_Ornithorhynchus_anatinus_5.0.1_chrMT.fa.gz" }));
	genomes.push_back(genome(29760, "Vitis vinifera (wine grape)", 427110216, { "vvi_ref_12X_chr1.fa.gz", "vvi_ref_12X_chr2.fa.gz", "vvi_ref_12X_chr3.fa.gz", "vvi_ref_12X_chr4.fa.gz", "vvi_ref_12X_chr5.fa.gz", "vvi_ref_12X_chr6.fa.gz", "vvi_ref_12X_chr7.fa.gz", "vvi_ref_12X_chr8.fa.gz", "vvi_ref_12X_chr9.fa.gz", "vvi_ref_12X_chr10.fa.gz", "vvi_ref_12X_chr11.fa.gz", "vvi_ref_12X_chr12.fa.gz", "vvi_ref_12X_chr13.fa.gz", "vvi_ref_12X_chr14.fa.gz", "vvi_ref_12X_chr15.fa.gz", "vvi_ref_12X_chr16.fa.gz", "vvi_ref_12X_chr17.fa.gz", "vvi_ref_12X_chr18.fa.gz", "vvi_ref_12X_chr19.fa.gz", "vvi_ref_12X_chrMT.fa.gz", "vvi_ref_12X_chrPltd.fa.gz" }));
	genomes.push_back(genome(15368, "Brachypodium distachyon", 271283624, { "bdi_ref_v1.0_chr1.fa.gz", "bdi_ref_v1.0_chr2.fa.gz", "bdi_ref_v1.0_chr3.fa.gz", "bdi_ref_v1.0_chr4.fa.gz", "bdi_ref_v1.0_chr5.fa.gz", "bdi_ref_v1.0_chrPltd.fa.gz" }));
	genomes.push_back(genome(7460, "Apis mellifera (honey bee)", 219645955, { "ame_ref_Amel_4.5_chrLG1.fa.gz", "ame_ref_Amel_4.5_chrLG2.fa.gz", "ame_ref_Amel_4.5_chrLG3.fa.gz", "ame_ref_Amel_4.5_chrLG4.fa.gz", "ame_ref_Amel_4.5_chrLG5.fa.gz", "ame_ref_Amel_4.5_chrLG6.fa.gz", "ame_ref_Amel_4.5_chrLG7.fa.gz", "ame_ref_Amel_4.5_chrLG8.fa.gz", "ame_ref_Amel_4.5_chrLG9.fa.gz", "ame_ref_Amel_4.5_chrLG10.fa.gz", "ame_ref_Amel_4.5_chrLG11.fa.gz", "ame_ref_Amel_4.5_chrLG12.fa.gz", "ame_ref_Amel_4.5_chrLG13.fa.gz", "ame_ref_Amel_4.5_chrLG14.fa.gz", "ame_ref_Amel_4.5_chrLG15.fa.gz", "ame_ref_Amel_4.5_chrLG16.fa.gz", "ame_ref_Amel_4.5_chrMT.fa.gz" }));
	genomes.push_back(genome(30195, "Bombus terrestris (buff-tailed bumblebee)", 216849342, { "bte_ref_Bter_1.0_chrLG_B01.fa.gz", "bte_ref_Bter_1.0_chrLG_B02.fa.gz", "bte_ref_Bter_1.0_chrLG_B03.fa.gz", "bte_ref_Bter_1.0_chrLG_B04.fa.gz", "bte_ref_Bter_1.0_chrLG_B05.fa.gz", "bte_ref_Bter_1.0_chrLG_B06.fa.gz", "bte_ref_Bter_1.0_chrLG_B07.fa.gz", "bte_ref_Bter_1.0_chrLG_B08.fa.gz", "bte_ref_Bter_1.0_chrLG_B09.fa.gz", "bte_ref_Bter_1.0_chrLG_B10.fa.gz", "bte_ref_Bter_1.0_chrLG_B11.fa.gz", "bte_ref_Bter_1.0_chrLG_B12.fa.gz", "bte_ref_Bter_1.0_chrLG_B13.fa.gz", "bte_ref_Bter_1.0_chrLG_B14.fa.gz", "bte_ref_Bter_1.0_chrLG_B15.fa.gz", "bte_ref_Bter_1.0_chrLG_B16.fa.gz", "bte_ref_Bter_1.0_chrLG_B17.fa.gz", "bte_ref_Bter_1.0_chrLG_B18.fa.gz" }));
	genomes.push_back(genome(7425, "Nasonia vitripennis (jewel wasp)", 191717756, { "nvi_ref_Nvit_2.0_chr1.fa.gz", "nvi_ref_Nvit_2.0_chr2.fa.gz", "nvi_ref_Nvit_2.0_chr3.fa.gz", "nvi_ref_Nvit_2.0_chr4.fa.gz", "nvi_ref_Nvit_2.0_chr5.fa.gz" }));
	genomes.push_back(genome(7070, "Tribolium castaneum (red flour beetle)", 187494969, { "tca_ref_chrLG1=X.fa.gz", "tca_ref_chrLG2.fa.gz", "tca_ref_chrLG3.fa.gz", "tca_ref_chrLG4.fa.gz", "tca_ref_chrLG5.fa.gz", "tca_ref_chrLG6.fa.gz", "tca_ref_chrLG7.fa.gz", "tca_ref_chrLG8.fa.gz", "tca_ref_chrLG9.fa.gz", "tca_ref_chrLG10.fa.gz" }));

	// Declare kernel variables.
	unsigned int       mask_array_32[CHARACTER_CARDINALITY];	// The 32-bit mask array of pattern.
	unsigned long long mask_array_64[CHARACTER_CARDINALITY];	// The 64-bit mask array of pattern.
	unsigned int       test_bit_32;	// The test bit for determining matches of patterns of length 32.
	unsigned long long test_bit_64;	// The test bit for determining matches of patterns of length 64.
	const unsigned int max_match_count = 1000;	// Maximum number of matches of one single query.
	unsigned int match[max_match_count];	// The matches returned by the CUDA agrep kernel.
	unsigned int match_count;	// Actual number of matches in the match array. match_count <= potential_match_count should always holds.
	unsigned int *scodon_device;	// CUDA global memory pointer pointing to the special codon array.
	unsigned int *match_device;	// CUDA global memory pointer pointing to the match array.

	// Initialize epoch
	const auto epoch = date(1970, 1, 1);

	while (true)
	{
		// Fetch jobs.
		auto cursor = conn.query(collection, QUERY("done" << BSON("$exists" << false)).sort("submitted"), 100); // Each batch processes 100 jobs.
		while (cursor->more())
		{
			const auto job = cursor->next();
			const auto _id = job["_id"].OID();
			cout << "Executing job " << _id.str() << endl;

			// Obtain the target genome via taxid.
			const auto taxid = job["taxid"].Int();
			unsigned int i;
			for (i = 0; i < genomes.size(); ++i)
			{
				if (taxid == genomes[i].taxid) break;
			}
			BOOST_ASSERT(i < genomes.size());
			const auto& g = genomes[i];
			cout << "Searching the genome of " << g.name << endl;

			// Set up CUDA kernel.
			checkCudaErrors(cudaMalloc((void**)&scodon_device, sizeof(unsigned int) * g.scodon.size()));
			checkCudaErrors(cudaMemcpy(scodon_device, &g.scodon.front(), sizeof(unsigned int) * g.scodon.size(), cudaMemcpyHostToDevice));
			checkCudaErrors(cudaMalloc((void**)&match_device, sizeof(unsigned int) * max_match_count));
			initAgrepKernel(scodon_device, g.character_count, match_device, max_match_count);

			// Create a job directory, open log and pos files, and write headers.
			const path job_path = jobs_path / _id.str();
			create_directory(job_path);
			boost::filesystem::ofstream log(job_path / "log.csv");
			boost::filesystem::ofstream pos(job_path / "pos.csv");
			log << "Query Index,Pattern,Edit Distance,Number of Matches\n";
			pos << "Query Index,Match Index,File Index,Ending Position\n";

			// Parse and execute queries.
			istringstream in(job["queries"].String());
			string line;
			size_t qi;
			for (qi = 0; getline(in, line); ++qi)
			{
				BOOST_ASSERT(line.size() <= 65);
				const unsigned int m = line.size() - 1;		// Pattern length.
				const unsigned int k = line.back() - 48;	// Edit distance.
				if (m <= 32)
				{
					memset(mask_array_32, 0, sizeof(unsigned int) * CHARACTER_CARDINALITY);
					for (unsigned int i = 0; i < m; ++i)
					{
						unsigned int j = (unsigned int)1 << i;
						if ((line[i] == 'N') || (line[i] == 'n'))
						{
							mask_array_32[0] |= j;
							mask_array_32[1] |= j;
							mask_array_32[2] |= j;
							mask_array_32[3] |= j;
						}
						else
						{
							mask_array_32[encode(line[i])] |= j;
						}
					}
					mask_array_32[0] ^= MAX_UNSIGNED_INT;
					mask_array_32[1] ^= MAX_UNSIGNED_INT;
					mask_array_32[2] ^= MAX_UNSIGNED_INT;
					mask_array_32[3] ^= MAX_UNSIGNED_INT;
					test_bit_32 = (unsigned int)1 << (m - 1);
					transferMaskArray32(mask_array_32, test_bit_32);
				}
				else // m > 32
				{
					memset(mask_array_64, 0, sizeof(unsigned long long) * CHARACTER_CARDINALITY);
					for (unsigned int i = 0; i < m; ++i)	// Derive the mask array of current pattern.
					{
						unsigned long long j = (unsigned long long)1 << i;
						if ((line[i] == 'N') || (line[i] == 'n'))
						{
							mask_array_64[0] |= j;
							mask_array_64[1] |= j;
							mask_array_64[2] |= j;
							mask_array_64[3] |= j;
						}
						else
						{
							mask_array_64[encode(line[i])] |= j;
						}
					}
					mask_array_64[0] ^= MAX_UNSIGNED_LONG_LONG;
					mask_array_64[1] ^= MAX_UNSIGNED_LONG_LONG;
					mask_array_64[2] ^= MAX_UNSIGNED_LONG_LONG;
					mask_array_64[3] ^= MAX_UNSIGNED_LONG_LONG;
					test_bit_64 = (unsigned long long)1 << (m - 1);
					transferMaskArray64(mask_array_64, test_bit_64);
				}

				// Invoke kernel.
				invokeAgrepKernel(m, k, g.block_count);
				checkCudaErrors(cudaGetLastError());
				// Don't waste the CPU time before waiting for the CUDA agrep kernel to exit.
				const unsigned int m_minus_k = m - k;	// Used to determine whether a match is across two consecutive sequences.
				const unsigned int m_plus_k = m + k;	// Used to determine whether a match is across two consecutive sequences.
				checkCudaErrors(cudaDeviceSynchronize());	// Block until the CUDA agrep kernel completes.

				// Retrieve matches from device.
				getMatchCount(&match_count);
				if (match_count > max_match_count) match_count = max_match_count;	// If the number of matches exceeds max_match_count, only the first max_match_count matches will be saved into the result file.
				checkCudaErrors(cudaMemcpy(match, match_device, sizeof(unsigned int) * match_count, cudaMemcpyDeviceToHost));

				// Decompose absolute matches into sequences and positions within sequence.
				vector<unsigned int> match_sequences, match_positions;
				match_sequences.reserve(match_count);
				match_positions.reserve(match_count);
				for (unsigned int i = 0; i < match_count; i++)
				{
					unsigned int position = match[i];	// The absolute ending position of current match.
					unsigned int sequence = g.block_to_sequence[position >> (L + B + 4)];	// Use block-to-sequence mapping to get the nearest sequence index.
					while (position >= g.sequence_cumulative_length[sequence + 1]) sequence++; // Now sequence is the sequence index of match[i].
					position -= g.sequence_cumulative_length[sequence];	// Now position is the character index within sequence.
					if (position + 1 < m_minus_k) continue; // The current match must be across two consecutive sequences. It is thus an invalid matching.
					match_sequences.push_back(sequence);
					match_positions.push_back(position);
				}

				// Output filtered matches.
				const auto filtered_match_count = match_sequences.size();
				log << qi << ',' << line.substr(0, m) << ',' << k << ',' << filtered_match_count << '\n';
				for (auto i = 0; i < filtered_match_count; ++i)
				{
					pos << qi << ',' << i << ',' << match_sequences[i] << ',' << match_positions[i] << '\n';
//					if (match_sequences[i] && (match_positions[i] + 1 < m_plus_k)); // This match may possibly be across two consecutive sequences.
				}
			}

			// Release resources.
			pos.close();
			log.close();
			checkCudaErrors(cudaFree(match_device));
			checkCudaErrors(cudaFree(scodon_device));
			checkCudaErrors(cudaDeviceReset());

			// Update progress.
			const auto millis_since_epoch = duration_cast<std::chrono::milliseconds>(system_clock::now().time_since_epoch()).count();
			conn.update(collection, BSON("_id" << _id), BSON("$set" << BSON("done" << Date_t(millis_since_epoch))));
			const auto err = conn.getLastError();
			if (!err.empty())
			{
				cerr << err << endl;
			}

			// Send completion notification email.
			const auto email = job["email"].String();
			cout << "Sending a completion notification email to " << email << endl;
			MailMessage message;
			message.setSender("igrep <noreply@cse.cuhk.edu.hk>");
			message.setSubject("Your igrep job has completed");
			message.setContent("Your igrep job submitted on " + to_simple_string(ptime(epoch, boost::posix_time::milliseconds(job["submitted"].Date().millis))) + " UTC searching the genome of " + g.name + " for " + to_string(qi) + " patterns was done on " + to_simple_string(ptime(epoch, boost::posix_time::milliseconds(millis_since_epoch))) + " UTC. View result at http://istar.cse.cuhk.edu.hk/igrep");
			message.addRecipient(MailRecipient(MailRecipient::PRIMARY_RECIPIENT, email));
			SMTPClientSession session("137.189.91.190");
			session.login();
			session.sendMessage(message);
			session.close();
		}

		// Sleep for a second.
		this_thread::sleep_for(std::chrono::seconds(10));
	}
	return 0;
}
