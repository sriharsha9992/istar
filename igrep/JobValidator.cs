using System;
using System.Diagnostics.Contracts;

namespace CUDAagrep
{
    //[ContractClass(typeof(IJobValidatorContract))]
    public interface IJobValidator
    {
        bool ValidateGenomeName(string genomeName);
        bool ValidateQueryText(string queryText);
        int GetNumQueries(string queryText);
    }

    //[ContractClassFor(typeof(IJobValidator))]
    //public abstract class IJobValidatorContract : IJobValidator
    //{
    //    public bool ValidateGenomeName(string genomeName)
    //    {
    //        Contract.Requires(genomeName != null);
    //        return default(bool);
    //    }

    //    public bool ValidateQueryText(string queryText)
    //    {
    //        Contract.Requires(queryText != null);
    //        return default(bool);
    //    }
    //}

    public class JobValidator : IJobValidator
    {
        /// <summary>
        /// Validate the specified genome name.
        /// </summary>
        /// <param name="genomeName">The genome name to validate.</param>
        /// <returns>True if the specified genome name is a substring of any of the valid genome names.</returns>
        public bool ValidateGenomeName(string genomeName)
        {
            return Genome.GetGenome(genomeName) != null;
        }

        /// <summary>
        /// Validate a collection of queries.
        /// </summary>
        /// <param name="queryText">The query text, each line of which is a single query.</param>
        /// <returns>Number of queries if all the queries conform to the standard format, 0 otherwise.</returns>
        public bool ValidateQueryText(string queryText)
        {
            //Contract.Requires(queryText != null);
            //if (queryText == null) throw new ArgumentNullException("queryText");
            return GetNumQueries(queryText) > 0;
        }

        /// <summary>
        /// Validate a collection of queries.
        /// </summary>
        /// <param name="queryText">The query text, each line of which is a single query.</param>
        /// <returns>Number of queries if all the queries conform to the standard format, 0 otherwise.</returns>
        public int GetNumQueries(string queryText)
        {
            //Contract.Requires(queryText != null);
            //if (queryText == null) throw new ArgumentNullException("queryText");
            if (string.IsNullOrEmpty(queryText)) return 0;

            var queries = queryText.Split(new char[] { '\n' }, StringSplitOptions.None);
            if ((queries.Length == 0) || (queries.Length > 10000)) return 0;
            foreach (var query in queries)
            {
                if (!ValidateSingleQuery(query)) return 0;
            }
            return queries.Length;
        }

        /// <summary>
        /// Validate a single query.
        /// </summary>
        /// <param name="query">A query consists of a pattern of alphabet uppercase <i>A, C, G, T</i> and an edit distance from 0 to 9.</param>
        /// <returns>True if the query conforms to the standard format, false otherwise.</returns>        
        internal bool ValidateSingleQuery(string query)
        {
            Contract.Requires(query != null);
            //if (query == null) throw new ArgumentNullException("query");

            var queryLength = query.Length;
            if ((queryLength > 65) || (queryLength < 2)) return false;
            var lastCharacter = query.Substring(queryLength - 1, 1);
            int editDistance;
            if (!int.TryParse(lastCharacter, out editDistance)) return false;
            var pattern = query.Substring(0, queryLength - 1);
            if (pattern.Length <= editDistance) return false;
            foreach (char c in pattern)
            {
                if (!((c == 'A') || (c == 'C') || (c == 'G') || (c == 'T') || (c == 'N'))) return false;
            }
            return true;
        }
    }
}
