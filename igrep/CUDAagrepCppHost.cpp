/**
 * @file CUDAagrep.cpp
 *
 * @brief This is a CUDA implementation of the agrep algorithm,
 * which is used for approximate string matching.
 *
 * @author Hongjian Li, The Chinese University of Hong Kong.
 *
 * Copyright (C) 2010 Hongjian Li, The Chinese University of Hong Kong.
 */
#include "stdafx.h"
#include <cassert>	/** Used for assertions. */
#include <vcclr.h>	/** Visual C++ CLR. */
#include <cutil_inline.h>	/** Used for timing and error handling by auxiliary macros such as cutilSafeCall. */

using namespace System;
using namespace System::Collections::Generic;
using namespace System::IO;

// About genomes.
#define DEFAULT_GENOMES_DIRECTORY "Genomes/"	/**< The default genomes directory relative to the current working directory. */
#define GENOME_COUNT 17	/**< Number of genoems. */

// About corpus.
#define MAX_CORPUS_FILE_PATH_LENGTH 100	/**< Maximum length of corpus file path, i.e. maximum length of lines in Corpus.txt. */

// About query. One query consists of a pattern followed by an edit distance.
#define MAX_QUERY_COUNT 10000	/**< Maximum number of patterns, i.e. up to this many lines of matches will be stored into Result.csv. */
#define MAX_PATTERN_LENGTH 64	/**< Maximum pattern length. A 64-bit machine word has 64 bits. */

// About sequence.
#define MAX_LINE_LENGTH 1000	/**< Maximum length of lines of fasta files. Fasta files are scanned line by line in this program. This value should be larger than or at least equal to the length of fasta header, which exceeds far 70 in most cases. */

// About nucleotide.
#define CHARACTER_CARDINALITY 4	/**< One nucleotide is either A, C, G, or T. */

// About result.
#define MAX_MATCH_COUNT 1000	/**< Maximum number of matches of one single query. */

// About CUDA implementation.
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
 * Invoke the cuda implementation of agrep kernel.
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
	return (character >> 1) & 3;
}

const char *Concatenate(const char *str1, const char *str2)
{
	size_t len1 = strlen(str1);
	size_t len2 = strlen(str2);
	char *str12 = new char[len1 + len2 + 1];	// Include the null character.
	strcpy_s(str12, len1 + 1, str1);
	strcpy_s(str12 + len1, len2 + 1, str2);
	return str12;
}

const char *ConvertString(String^ source)
{
   pin_ptr<const wchar_t> wch = PtrToStringChars(source);	// Pin memory so GC can't move it while native function is called
   size_t chSize = source->Length + 1;
   size_t wchSize = chSize << 1;
   char *ch = new char[chSize];
   size_t convertedChars = 0;
   wcstombs_s(&convertedChars, ch, chSize, wch, wchSize);	// convertedChars should be equal to source->Length + 1.
   return ch;
}

struct Genome
{
public:

	// About genome
	char *name;	/**< Genome name. */
	const char *genome_directory;	/**< The directory to a genome. */
	char **corpus_file;	/**< Corpus files. */
	unsigned int corpus_file_count;	/**< Actual number of corpus files. */
	unsigned int character_count;	/**< Actual number of characters. */

	// About sequence.
	char **sequence_header;	/**< Headers of sequences. */
	unsigned int *sequence_length;	/**< Lengthes of sequences. */
	unsigned int *sequence_cumulative_length;	/**< Cumulative lengths of sequences, i.e. 1) sequence_cumulative_length[0] = 0; 2) sequence_cumulative_length[sequence_index + 1] = sequence_cumulative_length[sequence_index] + sequence_length[sequence_index]; */
	unsigned int sequence_count;	/**< Actual number of sequences. */

	// About CUDA implementation.
	unsigned int *block_to_sequence;	/**< Mapping of thread blocks to sequences. */
	unsigned int block_count;	/**< Actual number of thread blocks. */

	// Abou nucleotide.
	unsigned int *scodon;	/**< The entire genomic nucleotides are stored into this array, one element of which, i.e. one 32-bit unsigned int, can store up to 16 nucleotides because one nucleotide can be uniquely represented by two bits since it must be either A, C, G, or T. One unsigned int is called a special codon, or scodon for short, because it is similar to codon, in which three consecutive characters of mRNA determine one amino acid of resulting protein. */
	unsigned int scodon_count;	/**< Actual number of special codons. scodon_count = (character_count + 16 - 1) >> 4; */

	/**
	 * Parse the corpus container file. By default it is Corpus.txt.
	 */
	void parseCorpusContainerFile()
	{
		this->genome_directory = Concatenate(Concatenate(DEFAULT_GENOMES_DIRECTORY, this->name), "/");
		this->corpus_file = new char *[this->corpus_file_count];
		char line_buffer[MAX_CORPUS_FILE_PATH_LENGTH];
		size_t line_buffer_length;
		const char *corpus_container_file = Concatenate(this->genome_directory, "Corpus.txt");
		FILE *corpus_container_file_handle;	// The handle to corpus container file.
		int corpus_file_count = 0;
		char *corpus_file;
		fopen_s(&corpus_container_file_handle, corpus_container_file, "r");
		while (fgets(line_buffer, MAX_CORPUS_FILE_PATH_LENGTH, corpus_container_file_handle) != NULL)
		{
			line_buffer_length = strlen(line_buffer) - 1;
			line_buffer[line_buffer_length] = '\0';
			corpus_file = new char[line_buffer_length + 1];
			strcpy_s(corpus_file, line_buffer_length + 1, line_buffer);
			this->corpus_file[corpus_file_count++] = corpus_file;
		}
		fclose(corpus_container_file_handle);
		assert(this->corpus_file_count == corpus_file_count);
	}

	/**
	 * Build the special codon array. Corpus files are enumerated. Statistics of the corpus are calculated.
	 */
	void buildSpecialCodonArray()
	{
		FILE *corpus_file_handle;	// The handle to corpus file.
		unsigned int corpus_file_index; // Used to enumerate corpus_file[].
		char line_buffer[MAX_LINE_LENGTH];	// fgets(line_buffer, MAX_LINE_LENGTH, corpus_file_handle);
		size_t line_buffer_length;	// Length of line_buffer.
		unsigned int line_buffer_index;	// Used to enumerate line_buffer[].
		int sequence_index;	// Used to enumerate sequence_header[] and sequence_length[].
		char *sequence_header;	//  Used to temporarily store the sequence header.
		unsigned int character_index;	// Index of the current character across all the sequences of the entire corpus.
		unsigned int character_index_lowest_four_bits;	// The lowest four bits of character_index;
		unsigned int scodon_buffer;	// 16 consecutive characters will be accommodated into one 32-bit unsigned int.
		unsigned int scodon_index;	// scodon[scodon_index] = scodon_buffer; In CUDA implementation, special codons need to be properly shuffled in order to satisfy coalesced global memory access.

		this->scodon_count = (this->character_count + 16 - 1) >> 4;
		this->block_count = (this->scodon_count + (1 << (L + B)) - 1) >> (L + B);	// Calculate the number of thread blocks.	
		this->scodon = new unsigned int [this->block_count << (L + B)];	// Now the size of the special codon array is a multiple of 2^(L + B).
		this->sequence_count = this->corpus_file_count;	// Note that sequence_count = corpus_file_count for assembled genomes.
		this->sequence_header = new char *[this->sequence_count];
		this->sequence_length = new unsigned [this->sequence_count];
		this->sequence_cumulative_length = new unsigned [this->sequence_count + 1];
		this->sequence_cumulative_length[0] = 0;
		sequence_index = -1;
		character_index = 0;
		for (corpus_file_index = 0; corpus_file_index < this->corpus_file_count; corpus_file_index++)
		{
			fopen_s(&corpus_file_handle, Concatenate(this->genome_directory, this->corpus_file[corpus_file_index]), "r");
			while (fgets(line_buffer, MAX_LINE_LENGTH, corpus_file_handle) != NULL)
			{
				line_buffer_length = strlen(line_buffer) - 1; // Exclude the last character which is '\n' of ASCII code '\10'.
				if (line_buffer[0] == '>') // Header line
				{
					if (++sequence_index > 0) // Not the first sequence.
					{
						sequence_cumulative_length[sequence_index] = character_index;
						sequence_length[sequence_index - 1] = character_index - sequence_cumulative_length[sequence_index - 1];
					}
					line_buffer[line_buffer_length] = '\0';
					sequence_header = new char [line_buffer_length + 1];
					strcpy_s(sequence_header, line_buffer_length + 1, line_buffer);
					this->sequence_header[sequence_index] = sequence_header;
				}
				else
				{
					// Use line_buffer_index to enumerate line_buffer, equivalent to foreach (char character in line_buffer)
					for (line_buffer_index = 0; line_buffer_index < line_buffer_length; line_buffer_index++)
					{
						character_index_lowest_four_bits = character_index & 15;
						scodon_buffer |= encode(line_buffer[line_buffer_index]) << (character_index_lowest_four_bits << 1); // Earlier characters reside in lower bits, while later characters reside in higher bits.
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
							this->scodon[scodon_index] = scodon_buffer;
							scodon_buffer = 0;
						}
						character_index++;
					}
				}
			}
			fclose(corpus_file_handle);
		}
		// Calculate statistics.
		assert(this->character_count == character_index);
		assert(this->sequence_count == sequence_index + 1);
		this->sequence_cumulative_length[sequence_count] = this->character_count;
		this->sequence_length[sequence_index] = this->character_count - this->sequence_cumulative_length[sequence_index];
		scodon_index = character_index >> 4;
		if (scodon_index < this->scodon_count)	// There are some corpus nucleotides in the special codon buffer, flush it.
		{
			scodon_index = (scodon_index & (MAX_UNSIGNED_INT ^ ((1 << (L + B)) - 1)))
						 | ((scodon_index & ((1 << L) - 1)) << B)
						 | ((scodon_index >> L) & ((1 << B) - 1));
			this->scodon[scodon_index] = scodon_buffer; // Now the last special codon might have zeros in its least significant bits. Don't treat such zeros as 'A's.
		}
	}

	/**
	 * Calculate thread blocks to sequences mapping, i.e. fill block_to_sequence[].
	 */
	void buildBlockToSequenceMapping()
	{
		unsigned int character_index = 0;
		unsigned int sequence_index = 0;
		this->block_to_sequence = new unsigned int[block_count];
		for (unsigned int block_index = 0; block_index < block_count; block_index++)
		{
			while (character_index >= this->sequence_cumulative_length[sequence_index + 1]) sequence_index++;
			this->block_to_sequence[block_index] = sequence_index;
			character_index += (1 << (L + B + 4)); // One thread block processes 1 << (L + B) special codons, and each special codon encodes 1 << 4 characters.
		}
	}
};	// End of struct Genome

// Global variables.
unsigned int timer;	// Each timer has a unique id.
Genome **Genomes;

ref class FileSysEventHandler
{
public:
	static Dictionary<String^, Int32> Genome_Name_Dictionary;
	void OnChanged(Object^ source, FileSystemEventArgs^ e)
	{
		// About query.
		const char *guid;	// yyyy-MM-dd-hh-mm-ss
		FILE *query_file_handle;	// The handle to query file.
		char query_buffer[MAX_PATTERN_LENGTH + 3];	// The buffer for temporarily storing query. query = 64b pattern + 1b edit distance + 1b \10 + 1b \0.
		size_t query_length;	// The length of each query.
		char pattern[MAX_QUERY_COUNT][MAX_PATTERN_LENGTH + 1];	// Patterns. 64b pattern + 1b \0.
		unsigned int edit_distance[MAX_QUERY_COUNT];	// Number of primitive operations necessary to convert one string into an exact copy of the other. Primitive operations include insertion, deletion, and substitution of one character.
		unsigned int query_count;	// Actual number of queries.
		float query_time;	// The querying time of one single query.
		const char *current_pattern;	// The pattern of current query.
		unsigned int m;	// Pattern length.
		unsigned int k;	// Edit distance.

		// About agrep algorithm.
		unsigned int       mask_array_32[CHARACTER_CARDINALITY];	// The 32-bit mask array of pattern.
		unsigned long long mask_array_64[CHARACTER_CARDINALITY];	// The 64-bit mask array of pattern.
		unsigned int       test_bit_32;	// The test bit for determining matches of patterns of length 32.
		unsigned long long test_bit_64;	// The test bit for determining matches of patterns of length 64.

		// About CUDA implementation.
		unsigned int *scodon_device;	// CUDA global memory pointer pointing to the special codon array.
		unsigned int *match_device;	// CUDA global memory pointer pointing to the match array.
		unsigned int match[MAX_MATCH_COUNT];	// The matches returned by the CUDA agrep kernel.
		unsigned int match_block_value;		// The value of the block of the current matching position. Used as match_block_value = matching_block[i];
		unsigned int m_minus_k;	// m_minus_k = m - k; Used to determine whether a match is across two consecutive sequences.
		unsigned int m_plus_k;	// m_plus_k  = m + k; Used to determine whether a match is across two consecutive sequences.

		// About result.
		unsigned int match_sequence [MAX_MATCH_COUNT];	// The sequence  indexes of matches.
		unsigned int match_character[MAX_MATCH_COUNT];	// The character indexes of matches, i.e. ending positions of matches.
		unsigned int match_sequence_value;	// The sequence  index of a match.
		unsigned int match_character_value;	// The character index of a match.
		unsigned int match_count;	// Actual number of matches in the match array. match_count <= potential_match_count should always holds.
		unsigned int filtered_match_count;	// Actual number of matches after filtering.
		const char *result_file;	// Result_{Guid}.csv
		FILE *result_file_handle;	// The handle to result file "Result_{Guid}.csv".
		const char *log_file;	// Log_{Guid}.csv
		FILE *log_file_handle;		// The handle to log file "Log_{Guid}.csv".

		// Obtain the time stamp.
		Console::WriteLine(DateTime::Now.ToString());
		guid = ConvertString(e->Name->Substring(e->Name->Length - 40, 36));
		printf_s("Guid: %s\n", guid);

		// Obtain the selected genome.
		String^ genomeName = e->Name->Substring(0, e->Name->Length - 47);
		Genome *genome = Genomes[Genome_Name_Dictionary[genomeName]];

		// Allocate the special codon array.
		cutilSafeCall(cudaMalloc((void**)&scodon_device, sizeof(unsigned int) * (genome->block_count << (L + B))));
		// Transfer the special codon array from host to device.
		cutilSafeCall(cudaMemcpy(scodon_device, genome->scodon, sizeof(unsigned int) * (genome->block_count << (L + B)), cudaMemcpyHostToDevice));
		// Allocate the match array.
		cutilSafeCall(cudaMalloc((void**)&match_device, sizeof(unsigned int) * MAX_MATCH_COUNT));
		// Transfer necessary arguments to CUDA constant memory.
		initAgrepKernel(scodon_device, genome->character_count, match_device, MAX_MATCH_COUNT);

		// Read and parse the query file.
		query_count = 0;
		fopen_s(&query_file_handle, ConvertString(e->FullPath), "r");
		while (fgets(query_buffer, MAX_PATTERN_LENGTH + 3, query_file_handle) != NULL)
		{
			query_length = strlen(query_buffer);
			if (query_buffer[query_length - 1] == 10) query_length--;	// Exclude the last character which is '\n' of ASCII code '\10'.			
			edit_distance[query_count] = query_buffer[query_length - 1] - 48;	// char '0' is '\48'.
			query_buffer[query_length - 1] = '\0';
			strcpy_s(pattern[query_count], query_length, query_buffer);
			query_count++;
		}
		fclose(query_file_handle);

		printf_s("Searching %s genome for %u queries.\n", genome->name, query_count);

		// Open result file and log file for writing headers.
		result_file = Concatenate(Concatenate(Concatenate(genome->genome_directory, "Result_"), guid), ".csv");
		log_file = Concatenate(Concatenate(Concatenate(genome->genome_directory, "Log_"), guid), ".csv");
		fopen_s(&result_file_handle, result_file, "w");
		fprintf_s(result_file_handle, "Searching %s genome for %u queries.\n\n", genome->name, query_count);
		fprintf_s(result_file_handle, "Sequence Index,File Name,Fasta Header\n");
		for (unsigned int i = 0; i < genome->sequence_count; i++)
		{
			fprintf_s(result_file_handle, "%u,%s,\"%s\"\n", i, genome->corpus_file[i], genome->sequence_header[i]);
		}
		fprintf_s(result_file_handle, "\n");
		fopen_s(&log_file_handle, log_file, "w");
		fprintf_s(log_file_handle, "Query Index,Pattern,Edit Distance,Number of Matches,Querying Time (ms)\n");

		// Use query_index to enumerate pattern[] and edit_distance[].
		for (unsigned int query_index = 0; query_index < query_count; query_index++)
		{
			current_pattern = pattern[query_index];	// Given a pattern, three variables can be derived: m, mask_array, matching_bit.
			m = strlen(current_pattern);	// Pattern length.
			k = edit_distance[query_index];	// Edit distance.
			printf_s("Query %u: searching for %s with edit distance %u ... ", query_index, current_pattern, k);
			cutilCheckError(cutResetTimer(timer));	// Reset timer.
			cutilCheckError(cutStartTimer(timer));	// Start timing.
			if (m <= 32)
			{
				// Derive mask_array and test_bit.
				memset(mask_array_32, 0, sizeof(unsigned int) * CHARACTER_CARDINALITY);
				for (unsigned int i = 0; i < m; i++)	// Derive the mask array of current pattern.
				{
					unsigned int j = (unsigned int)1 << i;
					if (current_pattern[i] == 'N')
					{
						mask_array_32[0] |= j;
						mask_array_32[1] |= j;
						mask_array_32[2] |= j;
						mask_array_32[3] |= j;
					}
					else
					{
						mask_array_32[encode(current_pattern[i])] |= j;
					}
				}
				mask_array_32[0] ^= MAX_UNSIGNED_INT;
				mask_array_32[1] ^= MAX_UNSIGNED_INT;
				mask_array_32[2] ^= MAX_UNSIGNED_INT;
				mask_array_32[3] ^= MAX_UNSIGNED_INT;
				test_bit_32 = (unsigned int)1 << (m - 1);	// The test bit for determining matches of patterns of length 32.
				transferMaskArray32(mask_array_32, test_bit_32);
			}
			else // m > 32
			{
				// Derive mask_array and test_bit.
				memset(mask_array_64, 0, sizeof(unsigned long long) * CHARACTER_CARDINALITY);
				for (unsigned int i = 0; i < m; i++)	// Derive the mask array of current pattern.
				{
					unsigned long long j = (unsigned long long)1 << i;
					if (current_pattern[i] == 'N')
					{
						mask_array_64[0] |= j;
						mask_array_64[1] |= j;
						mask_array_64[2] |= j;
						mask_array_64[3] |= j;
					}
					else
					{
						mask_array_64[encode(current_pattern[i])] |= j;
					}
				}
				mask_array_64[0] ^= MAX_UNSIGNED_LONG_LONG;
				mask_array_64[1] ^= MAX_UNSIGNED_LONG_LONG;
				mask_array_64[2] ^= MAX_UNSIGNED_LONG_LONG;
				mask_array_64[3] ^= MAX_UNSIGNED_LONG_LONG;
				test_bit_64 = (unsigned long long)1 << (m - 1);	// The test bit for determining matches of patterns of length 64.
				transferMaskArray64(mask_array_64, test_bit_64);
			}
			invokeAgrepKernel(m, k, genome->block_count);
			cutilCheckMsg("CUDA agrep kernel execution failed.");
			// Don't waste the CPU time before waiting for the CUDA agrep kernel to exit.
			m_minus_k = m - k;
			m_plus_k  = m + k;
			filtered_match_count = 0;
			cutilSafeCall(cudaThreadSynchronize());	// Block until the CUDA agrep kernel completes.
			getMatchCount(&match_count);
			if (match_count > MAX_MATCH_COUNT) match_count = MAX_MATCH_COUNT;	// If the number of matches exceeds MAX_MATCH_COUNT, only the first MAX_MATCH_COUNT matches will be saved into the result file.
			cutilSafeCall(cudaMemcpy(match, match_device, sizeof(unsigned int) * match_count, cudaMemcpyDeviceToHost));
			// Enumerate each match.
			for (unsigned int i = 0; i < match_count; i++)
			{
				// match[i] is absolute. Decompose it into relative match_sequence_value and relative match_character_value.
				match_character_value = match[i];	// The absolute ending position of current match.
				match_block_value = match_character_value >> (L + B + 4);	// Derive the thread block that finds the current match.
				match_sequence_value = genome->block_to_sequence[match_block_value];	// Use block-to-sequence mapping to get the nearest sequence index.
				while (match_character_value >= genome->sequence_cumulative_length[match_sequence_value + 1]) match_sequence_value++; // Now match_sequence_value is the sequence index of match[i].
				match_character_value -= genome->sequence_cumulative_length[match_sequence_value];	// Now match_character_value is the character index of match[i].

				if (match_character_value + 1 < m_minus_k) continue; // The current match must be across two consecutive sequences. It is thus an invalid matching.
				match_sequence [filtered_match_count] = match_sequence_value;
				match_character[filtered_match_count] = match_character_value;
				filtered_match_count++;
			}
			cutilCheckError(cutStopTimer(timer));	// Stop timing.
			query_time = cutGetTimerValue(timer);	// Obtain the querying time of current query.
			printf_s("done. %u matches found. (%.2f ms)\n", filtered_match_count, query_time);
			fprintf_s(log_file_handle, "%u,%s,%u,%u,%.2f\n", query_index, current_pattern, k, match_count, query_time);
			fprintf_s(result_file_handle, "Query Index,Pattern,Edit Distance,Number of Matches,Querying Time (ms)\n");
			fprintf_s(result_file_handle, "%u,%s,%u,%u,%.2f\n", query_index, current_pattern, k, match_count, query_time);
			if (filtered_match_count >  0) fprintf_s(result_file_handle, "Query Index,Match Index,Sequence Index,Ending Position\n");
			// Output each filtered match.
			for (unsigned int i = 0; i < filtered_match_count; i++)
			{
				match_sequence_value  = match_sequence [i];
				match_character_value = match_character[i];
				fprintf_s(result_file_handle, "%u,%u,%u,%u", query_index, i, match_sequence_value, match_character_value);
				if ((match_sequence_value > 0) && (match_character_value + 1 < m_plus_k)) fprintf_s(result_file_handle, ",?"); // This match may possibly be across two consecutive sequences.
				fprintf_s(result_file_handle, "\n");
			}
			fprintf_s(result_file_handle, "\n");
		}
		// All queries are done. Release resources.
		fclose(log_file_handle);
		fclose(result_file_handle);
		cutilSafeCall(cudaFree(scodon_device));
		cutilSafeCall(cudaFree(match_device));
		cutilSafeCall(cudaThreadExit());
		printf_s("Searching %s genome for %u queries is done.\n\n", genome->name, query_count);
	}
};

/**
 * The entry of the CUDAagrepCppHost program.
 * @param[in] argc Number of arguments to the program.
 * @param[in] argv Arguments to the program.
 */
int main(int argc, char** argv)
{
	printf_s("CUDAagrep C++ Host v1.3a (Build September 17, 2011)\n");
	cutilCheckError(cutCreateTimer(&timer));	// Create a timer.

	// Initialize genomes.
	Genomes = new Genome*[GENOME_COUNT];

	Genome *Opossum = new Genome();
	Opossum->name = "Monodelphis domestica (Gray short-tailed opossum)";
	Opossum->corpus_file_count = 9;
	Opossum->character_count = 3502373038;
	Genomes[0] = Opossum;

	Genome *Chimpanzee = new Genome();
	Chimpanzee->name = "Pan troglodytes (Chimpanzee)";
	Chimpanzee->corpus_file_count = 25;
	Chimpanzee->character_count = 3175582169;
	Genomes[1] = Chimpanzee;

	Genome *Human = new Genome();
	Human->name = "Homo sapiens (Human)";
	Human->corpus_file_count = 24;
	Human->character_count = 3095677412;
	Genomes[2] = Human;

	Genome *Monkey = new Genome();
	Monkey->name = "Macaca mulatta (Rhesus monkey)";
	Monkey->corpus_file_count = 21;
	Monkey->character_count = 2863665185;
	Genomes[3] = Monkey;

	Genome *Rat = new Genome();
	Rat->name = "Rattus norvegicus (Rat)";
	Rat->corpus_file_count = 21;
	Rat->character_count = 2718881021;
	Genomes[4] = Rat;

	Genome *Mouse = new Genome();
	Mouse->name = "Mus musculus (Mouse)";
	Mouse->corpus_file_count = 21;
	Mouse->character_count = 2654895218;
	Genomes[5] = Mouse;

	Genome *Cow = new Genome();
	Cow->name = "Bos taurus (Cow)";
	Cow->corpus_file_count = 30;
	Cow->character_count = 2634413324;
	Genomes[6] = Cow;

	Genome *Dog = new Genome();
	Dog->name = "Canis familiaris (Dog)";
	Dog->corpus_file_count = 39;
	Dog->character_count = 2445110183;
	Genomes[7] = Dog;

	Genome *Horse = new Genome();
	Horse->name = "Equus caballus (Domestic horse)";
	Horse->corpus_file_count = 32;
	Horse->character_count = 2367053447;
	Genomes[8] = Horse;

	Genome *Zebrafish = new Genome();
	Zebrafish->name = "Danio rerio (Zebrafish)";
	Zebrafish->corpus_file_count = 25;
	Zebrafish->character_count = 1277075233;
	Genomes[9] = Zebrafish;

	Genome *Chicken = new Genome();
	Chicken->name = "Gallus gallus (Chicken)";
	Chicken->corpus_file_count = 31;
	Chicken->character_count = 1031883471;
	Genomes[10] = Chicken;

	Genome *Finch = new Genome();
	Finch->name = "Taeniopygia guttata (Zebra finch)";
	Finch->corpus_file_count = 34;
	Finch->character_count = 1018092713;
	Genomes[11] = Finch;

	Genome *Pig = new Genome();
	Pig->name = "Sus scrofa (Pig)";
	Pig->corpus_file_count = 10;
	Pig->character_count = 813033904;
	Genomes[12] = Pig;

	Genome *Platypus = new Genome();
	Platypus->name = "Ornithorhynchus anatinus (Platypus)";
	Platypus->corpus_file_count = 19;
	Platypus->character_count = 437080024;
	Genomes[13] = Platypus;

	Genome *Grape = new Genome();
	Grape->name = "Vitis vinifera (Grape)";
	Grape->corpus_file_count = 19;
	Grape->character_count = 303085820;
	Genomes[14] = Grape;

	Genome *Bee = new Genome();
	Bee->name = "Apis mellifera (Honey bee)";
	Bee->corpus_file_count = 16;
	Bee->character_count = 217194876;
	Genomes[15] = Bee;

	Genome *Beetle = new Genome();
	Beetle->name = "Tribolium castaneum (Red flour beetle)";
	Beetle->corpus_file_count = 10;
	Beetle->character_count = 187494969;
	Genomes[16] = Beetle;

	// Load genomes.
	printf_s("Loading %d genomes.\n", GENOME_COUNT);
	for (int i = 0; i < GENOME_COUNT; i++)
	{
		Genome *genome = Genomes[i];
		FileSysEventHandler::Genome_Name_Dictionary.Add(gcnew String(genome->name), i);
		printf_s("Loading %s genome ... ", genome->name);
		cutilCheckError(cutResetTimer(timer));	// Reset timer.
		cutilCheckError(cutStartTimer(timer));	// Start timing.
		genome->parseCorpusContainerFile();	// Parse the corpus container file. By default it is Corpus.txt.
		genome->buildSpecialCodonArray();	// Build the special codon array. Corpus files are enumerated. Statistics of the corpus are calculated.
		genome->buildBlockToSequenceMapping();	// Calculate thread block to sequence index mapping, i.e. fill block_to_sequence[].
		cutilCheckError(cutStopTimer(timer));	// Stop timing.
		printf_s("done. (%.2f ms)\n", cutGetTimerValue(timer));
	}
	printf_s("Loading %d genomes is done.\n\n", GENOME_COUNT);

	// Start monitoring file changes in the genomes directory.
	FileSystemWatcher^ fsWatcher = gcnew FileSystemWatcher();
	fsWatcher->Path = gcnew String(DEFAULT_GENOMES_DIRECTORY);
	fsWatcher->Filter = "*.txt";
	fsWatcher->NotifyFilter = NotifyFilters::LastWrite;
	fsWatcher->IncludeSubdirectories = true;
	FileSysEventHandler^ handler = gcnew FileSysEventHandler(); 
	fsWatcher->Changed += gcnew FileSystemEventHandler(handler, &FileSysEventHandler::OnChanged);
	fsWatcher->EnableRaisingEvents = true;

	// Wait for exit.
	getchar();
	fsWatcher->EnableRaisingEvents = false;
	cutilCheckError(cutDeleteTimer(timer));
	return 0;
}