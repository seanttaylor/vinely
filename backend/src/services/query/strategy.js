import { token } from "morgan";
import { Result } from "../../types/result.js";

const MAX_PHRASE_LENGTH = 3;

/**
 * @typedef {Object} QueryTokenizationResult
 * @property {any[]} phraseFilter  Matched phrase payloads
 * @property {any[]} keywordFilter Matched keyword payloads
 */

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
   * Extracts known phrases and keywords from a tokenized query
   * using a greedy longest-match strategy.
   *
   * @description Rules:
   * - Attempts longest phrase match first.
   * - If a phrase matches, its tokens are consumed.
   * - If no phrase matches, checks for a keyword match.
   * - Tokens not present in phraseMap or keywordMap are ignored.
   *
   * @note This function is intended for controlled-vocabulary search systems.
   *
   * @param {string[]} tokens  normalized query tokens
   * @param {PhraseMap} phraseMap phrase lookup table grouped by phrase length
   * @param {KeywordMap} keywordMap single-token keyword lookup table
   * @param {number} maxPhraseLength  maximum phrase length to attempt
   *
   * @returns {ExtractResult}
   */
  extractPhrases(
    tokens,
    phraseMap = this.vocabulary.phrases,
    keywordMap = this.vocabulary.keywords,
    maxPhraseLength = MAX_PHRASE_LENGTH
  ) {
    /** @type {QueryTokenizationResult} */
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

    return result;
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
};

/**
 * Abstract class representing a search strategy
 */
class SearchStrategy {
  constructor() {}

  search() {
    throw new Error("Missing implementation.");
  }

  useVocabulary(vocabulary) {
    this.vocabulary = vocabulary;
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
   * @returns {Result<Object | Problem>}
   */
  search(queryString) {
    const queryFilters = Result.ok(queryString)
      .map(queryTools.normalize)
      .map(queryTools.tokenize);
      //.map(queryTools.extractPhrases)

    console.log(queryFilters);

    throw new Error("Some random error");
    return Result.ok({
      queryResult: "Some random result",
    });
  }
}
