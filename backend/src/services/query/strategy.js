import { token } from "morgan";
import { Result } from "../../types/result.js";

const MAX_PHRASE_LENGTH = 3;

/**
 * Helper methods for pre-processing search queries
 */
const queryTools = {
  /**
   * @param {string} qs
   * @returns {string}
   */
  normalize(qs) {
    return qs.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ""); // remove punctuation
  },
  /**
   * Maps supported phrases and keywords from a tokenized query
   * to associated SQL fragments
   *
   * @description Rules:
   * - Attempts longest phrase match first.
   * - If a phrase matches, its tokens are consumed.
   * - If no phrase matches, checks for a keyword match.
   * - Tokens not present in `phraseMap` or `keywordMap` are ignored.
   *
   * @param {string[]} tokens  normalized query tokens
   * @param {PhraseMap} phraseMap phrase lookup table grouped by phrase length
   * @param {KeywordMap} keywordMap single-token keyword lookup table
   * @param {number} maxPhraseLength  maximum phrase length to attempt
   *
   * @returns {QueryTokenizationResult}
   */
  extractKeywords(
    tokens,
    phraseMap,
    keywordMap,
    maxPhraseLength = MAX_PHRASE_LENGTH
  ) {
    /**
     * @property {string[]} phraseFilter SQL fragments associated with matched phrases
     * @property {string[]} keywordFilter SQL fragments associated with matched keywords
     */
    const result = {
      phraseFilter: [],
      keywordFilter: [],
    };

    let index = 0;

    while (index < tokens.length) {
      let matched = false;

      const maxLength = Math.min(maxPhraseLength, tokens.length - index);

      // Greedy longest-match attempt
      for (let length = maxLength; length > 0; length--) {
        const candidate = tokens.slice(index, index + length).join(" ");

        if (phraseMap[length] && phraseMap[length][candidate]) {
          result.phraseFilter.push(phraseMap[length][candidate]);

          index += length; // consume matched tokens
          matched = true;
          break;
        }
      }

      if (!matched) {
        const token = tokens[index];

        if (keywordMap[token]) {
          result.keywordFilter.push(keywordMap[token]);
        }

        // If not in keywordMap, ignore token entirely
        index += 1;
      }
    }

    return [...result.keywordFilter, ...result.phraseFilter];
  },
  /**
   * @param {string} qs
   * @returns {string[]}
   */
  tokenize(qs) {
    return qs
      .split(/\s+/)
      .map((word) => {
        // naive plural removal
        if (word.endsWith("s")) return word.slice(0, -1);
        return word;
      })
      .filter(Boolean);
  },
  /**
   * @param {string[]} sqlFilters - list of SQL fragments that mapped to known keywords and phrases in the search vocabulary
   * @returns {string}
   */
  buildSQLQuery(sqlFilters) {
    return sqlFilters.length
      ? `SELECT * FROM wines WHERE ${sqlFilters.join(" AND ")}`
      : "";
  },
};

/**
 * Abstract class representing a search strategy
 */
class SearchStrategy {
  #vocabulary;

  constructor() {}

  search() {
    throw new Error("Missing implementation.");
  }

  /**
   * Sets the vocabulary used in search queries
   * @param {object} vocabulary
   */
  setVocabulary(vocabulary) {
    this.#vocabulary = vocabulary;
  }

  get vocabulary() {
    return this.#vocabulary;
  }
}

export class ProductLookupStrategy extends SearchStrategy {
  constructor() {
    super();
  }

  /**
   *
   * @param {String} queryString - the raw search query from the client
   * @returns {Result<Object | Problem>}
   */
  search(queryString) {
    throw new Error("Some random error");
    return Result.ok({
      queryResult: "Some random result",
    });
  }
}

export class ProductDiscoveryStrategy extends SearchStrategy {
  constructor() {
    super();
  }

  /**
   *
   * @param {String} queryString - the raw search query from the client
   * @param {Function} queryRunner - an async function that returns results from a datastore
   * @returns {Result}
   */
  async search(queryString, queryRunner) {
    const sqlResult = Result.ok(queryString)
      .map(queryTools.normalize)
      .map(queryTools.tokenize)
      .map((tokenizedQueryString) =>
        queryTools.extractKeywords(
          tokenizedQueryString,
          this.vocabulary.phrases,
          this.vocabulary.keywords
        )
      )
      .map(queryTools.buildSQLQuery);

    if (sqlResult.isError()) {
      return sqlResult;
    }

    return queryRunner(sqlResult.value);
  }
}
