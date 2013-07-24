// About nucleotide.
#define CHARACTER_CARDINALITY 4	/**< One character is either A, C, G, or T. */
__constant__ unsigned int *scodon;	/**< The special codon array. */
__constant__ unsigned int character_count;	/**< Number of characters. */
__constant__ unsigned int overlapping_character_count;	/**< Number of overlapping characters between two consecutive threads. */
__constant__ unsigned int overlapping_scodon_count;	/**< Number of overlapping special codons between two consecutive threads. */

// About agrep algorithm.
__constant__ unsigned int       mask_array_32[CHARACTER_CARDINALITY];	/**< The 32-bit mask array of pattern. */
__constant__ unsigned long long mask_array_64[CHARACTER_CARDINALITY];	/**< The 64-bit mask array of pattern. */
__constant__ unsigned int       test_bit_32;	/**< The test bit for determining matches of patterns of length 32. */
__constant__ unsigned long long test_bit_64;	/**< The test bit for determining matches of patterns of length 64. */

// About result.
__constant__ unsigned int max_match_count;	/**< Maximum number of matches of one single query. */
__constant__ unsigned int *match;	/**< The match array. */
__device__ volatile unsigned int match_count;	/**< Number of matches. */

// About CUDA implementation.
#define MAX_UNSIGNED_INT	0xffffffffUL	/**< The maximum value of an unsigned int. */
#define MAX_UNSIGNED_LONG_LONG	0xffffffffffffffffULL	/**< The maximum value of an unsigned long long. */
#define B 7	/**< Each thread block consists of 2^B (=1<<B) threads. */
#define L 8	/**< Each thread processes 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads. */

// Define constant edit distances so that the entire K+1 matching tables will be saved into registers.
// This trick is extremely essential for boosting performance.
#define K0 0	/**< Constant edit distance 0. */
#define K1 1	/**< Constant edit distance 1. */
#define K2 2	/**< Constant edit distance 2. */
#define K3 3	/**< Constant edit distance 3. */
#define K4 4	/**< Constant edit distance 4. */
#define K5 5	/**< Constant edit distance 5. */
#define K6 6	/**< Constant edit distance 6. */
#define K7 7	/**< Constant edit distance 7. */
#define K8 8	/**< Constant edit distance 8. */
#define K9 9	/**< Constant edit distance 9. */

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 0.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K0()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K0 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
	for (k = 1; k <= K0; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
			for (k = 1; k <= K0; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
			for (k = 1; k <= K0; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 1.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K1()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K1 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K1; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K1; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K1; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 2.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K2()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K2 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K2; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K2; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K2; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 3.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K3()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K3 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K3; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K3; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K3; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 4.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K4()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K4 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K4; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K4; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K4; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 5.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K5()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K5 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K5; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K5; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K5; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 6.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K6()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K6 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K6; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K6; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K6; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 7.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K7()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K7 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K7; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K7; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K7; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 8.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K8()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K8 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K8; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K8; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K8; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 32 bits and edit distance of 9.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel32K9()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned int mask_word;	// The mask word of a character from mask array.
	unsigned int r[K9 + 1];	// The most recent columns of K+1 matching tables.
	unsigned int r0;	// The second most recent column of previous matching table.
	unsigned int r1;	// The        most recent column of previous matching table.
	unsigned int r2;	// The second most recent column of current  matching table.
	unsigned int r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_INT;
#pragma unroll
	for (k = 1; k <= K9; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K9; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_32[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_32[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K9; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_32) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_32[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_32) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 0.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K0()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K0 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
	for (k = 1; k <= K0; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
			for (k = 1; k <= K0; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
			for (k = 1; k <= K0; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
		for (k = 1; k <= K0; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 1.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K1()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K1 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K1; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K1; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K1; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K1; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 2.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K2()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K2 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K2; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K2; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K2; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K2; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 3.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K3()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K3 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K3; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K3; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K3; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K3; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 4.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K4()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K4 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K4; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K4; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K4; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K4; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 5.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K5()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K5 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K5; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K5; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K5; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K5; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 6.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K6()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K6 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K6; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K6; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K6; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K6; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 7.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K7()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K7 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K7; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K7; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K7; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K7; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 8.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K8()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K8 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K8; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K8; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K8; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K8; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * The CUDA agrep kernel with matching tables of 64 bits and edit distance of 9.
 * All the necessary parameters are stored in constant memory.
 */
__global__ void agrepKernel64K9()
{
	// About CUDA implementation.
	extern __shared__ unsigned int scodon_header[][1 << B];	// Used to store the first overlapping_scodon_count special codons of each thread of a thread block.
	unsigned int block_base_index;	// The base index of current thread block.
	unsigned int inputting_scodon_base_index;	// The base index into inputting  special codon of current thread.
	unsigned int scodon_index;	// Used to enumerate the 2^L (=1<<L) special codons plus those in the overlapping zone of two consecutive threads.
	unsigned int scodon_buffer;	// The special codon currently being processed.

	// About agrep algorithm.
	unsigned int character_index;	// Used to enumerate the special codon buffer.
	unsigned long long mask_word;	// The mask word of a character from mask array.
	unsigned long long r[K9 + 1];	// The most recent columns of K+1 matching tables.
	unsigned long long r0;	// The second most recent column of previous matching table.
	unsigned long long r1;	// The        most recent column of previous matching table.
	unsigned long long r2;	// The second most recent column of current  matching table.
	unsigned long long r3;	// The        most recent column of current  matching table. r3 = function(r0, r1, r2, mask_value);
	unsigned int k;		// Used to enumerate K+1 matching tables.

	// About result.
	unsigned int outputting_scodon_base_index;	// The base index into outputting special codon of current thread.
	unsigned int matching_character_index;	// The output of the kernel. It stores the matching ending position.

	block_base_index = blockIdx.x << (L + B);	// The base index of current thread block.
	inputting_scodon_base_index  = block_base_index + threadIdx.x;	// Coalesced global memory access is ensured.
	outputting_scodon_base_index = block_base_index + (threadIdx.x << L);	// Original order of corpus.
	r[0] = MAX_UNSIGNED_LONG_LONG;
#pragma unroll
	for (k = 1; k <= K9; k++)
		r[k] = r[k - 1] << 1;	// Initialize K+1 matching tables according to agrep algorithm.
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K9; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
		}
		scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	}
	scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
	}
	for (; character_index < 16; character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			/* A possible match is found.
			 *   1) Calculate the matching character index, and ensure it does not exceed the corpus boundary.
			 *   2) Atomically increase match_count by 1, whose original value points to the index that the current match should be saved at.
			 *   3) Save the matching character index to the match array, if the max number of matches has not yet been exceeded.
			 */
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	scodon_header[scodon_index][threadIdx.x] = scodon_buffer;
	__syncthreads();	// Make sure all the threads of current thread block have saved their first overlapping_scodon_count special codons to the shared memory for later use by the previous thread.
	for (scodon_index++; scodon_index < (1 << L); scodon_index++)	// These special codons at index [overlapping_scodon_count, 2^L) are processed by current thread only once, hence no need to save them into shared memory.
	{
		scodon_buffer = scodon[inputting_scodon_base_index + (scodon_index << B)];
		mask_word = mask_array_64[(scodon_buffer >> 0) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 0;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 2) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 1;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 4) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 2;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 6) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 3;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 8) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 4;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 10) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 5;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 12) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 6;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 14) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 7;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 16) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 8;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 18) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 9;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 20) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 10;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 22) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 11;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 24) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 12;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 26) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 13;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 28) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 14;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
		mask_word = mask_array_64[(scodon_buffer >> 30) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + scodon_index) << 4) + 15;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
	for (scodon_index = 0; scodon_index < overlapping_scodon_count - 1; scodon_index++)
	{
		scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
		for (character_index = 0; character_index < 16; character_index++)
		{
			mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
			r2 = r[0];
			r3 = (r2 << 1) | mask_word;
			r[0] = r3;
#pragma unroll
			for (k = 1; k <= K9; k++)
			{
				r0 = r2;
				r1 = r3;
				r2 = r[k];
				r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
				r[k] = r3;
			}
			if (!(r3 & test_bit_64) && (match_count < max_match_count))
			{
				matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
				if (matching_character_index <= character_count)
					match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
			}
		}
	}
	scodon_buffer = ((threadIdx.x == (blockDim.x - 1)) ? scodon[block_base_index + (1 << (L + B)) + (scodon_index << B)] : scodon_header[scodon_index][threadIdx.x + 1]);
	for (character_index = 0; character_index < overlapping_character_count - ((overlapping_scodon_count - 1) << 4); character_index++)
	{
		mask_word = mask_array_64[(scodon_buffer >> (character_index << 1)) & 3];
		r2 = r[0];
		r3 = (r2 << 1) | mask_word;
		r[0] = r3;
#pragma unroll
		for (k = 1; k <= K9; k++)
		{
			r0 = r2;
			r1 = r3;
			r2 = r[k];
			r3 = ((r2 << 1) | mask_word) & ((r0 & r1) << 1) & r0;
			r[k] = r3;
		}
		if (!(r3 & test_bit_64) && (match_count < max_match_count))
		{
			matching_character_index = ((outputting_scodon_base_index + (1 << L) + scodon_index) << 4) + character_index;
			if (matching_character_index <= character_count)
				match[atomicAdd((unsigned int *)&match_count, 1)] = matching_character_index;
		}
	}
}

/**
 * Transfer necessary parameters to CUDA constant memory.
 * This agrep kernel initialization should be called only once for searching the same corpus.
 * @param[in] scodon_arg The special codon array.
 * @param[in] character_count_arg Actual number of characters.
 * @param[in] match_arg The match array.
 * @param[in] max_match_count_arg Maximum number of matches of one single query.
 */
extern "C" void initAgrepKernel(const unsigned int *scodon_arg, const unsigned int character_count_arg, const unsigned int *match_arg, const unsigned int max_match_count_arg)
{
	cudaMemcpyToSymbol(scodon, &scodon_arg, sizeof(unsigned int *));
	cudaMemcpyToSymbol(character_count, &character_count_arg, sizeof(unsigned int));
	cudaMemcpyToSymbol(match, &match_arg, sizeof(unsigned int *));
	cudaMemcpyToSymbol(max_match_count, &max_match_count_arg, sizeof(unsigned int));
}

/**
 * Transfer 32-bit mask array and test bit from host to CUDA constant memory.
 * @param[in] mask_array_arg The mask array of a pattern.
 * @param[in] test_bit_arg The test bit.
 */
extern "C" void transferMaskArray32(const unsigned int *mask_array_arg, const unsigned int test_bit_arg)
{
	cudaMemcpyToSymbol(mask_array_32, mask_array_arg, sizeof(unsigned int) * CHARACTER_CARDINALITY);
	cudaMemcpyToSymbol(test_bit_32, &test_bit_arg, sizeof(unsigned int));
}

/**
 * Transfer 64-bit mask array and test bit from host to CUDA constant memory.
 * @param[in] mask_array_arg The mask array of a pattern.
 * @param[in] test_bit_arg The test bit.
 */
extern "C" void transferMaskArray64(const unsigned long long *mask_array_arg, const unsigned long long test_bit_arg)
{
	cudaMemcpyToSymbol(mask_array_64, mask_array_arg, sizeof(unsigned long long) * CHARACTER_CARDINALITY);
	cudaMemcpyToSymbol(test_bit_64, &test_bit_arg, sizeof(unsigned long long));
}

/**
 * Invoke the cuda implementation of agrep kernel.
 * @param[in] m Pattern length.
 * @param[in] k Edit distance.
 * @param[in] block_count Number of thread blocks.
 */
extern "C" void invokeAgrepKernel(const unsigned int m, const unsigned int k, const unsigned int block_count)
{
	unsigned int overlapping_character_count_init = m + k - 1;
	unsigned int overlapping_scodon_count_init = (overlapping_character_count_init + 16 - 1) >> 4;
	unsigned int scodon_header_size = (sizeof(unsigned int) << B) * overlapping_scodon_count_init;	// Used to allocate dynamic shared memory. The first overlapping_scodon_count_init special codons of each thread will be saved into shared memory for the previous thread to continue processing.
	unsigned int match_count_init = 0;

	cudaMemcpyToSymbol(overlapping_character_count, &overlapping_character_count_init, sizeof(unsigned int));
	cudaMemcpyToSymbol(overlapping_scodon_count, &overlapping_scodon_count_init, sizeof(unsigned int));
	cudaMemcpyToSymbol(match_count, &match_count_init, sizeof(unsigned int));

	if (m <= 32)
	{
		switch (k)
		{
			case 0:
				agrepKernel32K0<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 1:
				agrepKernel32K1<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 2:
				agrepKernel32K2<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 3:
				agrepKernel32K3<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 4:
				agrepKernel32K4<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 5:
				agrepKernel32K5<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 6:
				agrepKernel32K6<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 7:
				agrepKernel32K7<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 8:
				agrepKernel32K8<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 9:
				agrepKernel32K9<<<block_count, 1 << B, scodon_header_size>>>();
				break;
		}
	}
	else // m > 32
	{
		switch (k)
		{
			case 0:
				agrepKernel64K0<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 1:
				agrepKernel64K1<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 2:
				agrepKernel64K2<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 3:
				agrepKernel64K3<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 4:
				agrepKernel64K4<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 5:
				agrepKernel64K5<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 6:
				agrepKernel64K6<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 7:
				agrepKernel64K7<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 8:
				agrepKernel64K8<<<block_count, 1 << B, scodon_header_size>>>();
				break;
			case 9:
				agrepKernel64K9<<<block_count, 1 << B, scodon_header_size>>>();
				break;
		}
	}
}

/**
 * Get the number of matches from CUDA constant memory.
 * @param[out] match_count_arg Number of matches.
 */
extern "C" void getMatchCount(unsigned int *match_count_arg)
{
	cudaMemcpyFromSymbol(match_count_arg, match_count, sizeof(unsigned int));
}
