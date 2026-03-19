import { Result } from "../../types/result.js";
import { Problem } from "../../types/problem.js";

const MAX_PHRASE_LENGTH = 3;

/**
 * Mapping of SQL table names to query aliases; used in the
 * SQL template fragment expansion step in the query pipeline
 * @readonly
 * @enum {string}
 */
const ALIAS = Object.freeze({
  wine_grapes: "wg",
});


/**
 * Mapping of required join table names to aliased JOIN clause tempaltes; they 
 * are later expanded into the SQL string resulting from the query pipeline
 * @readonly
 * @enum {string}
 */
const JOIN_REGISTRY = Object.freeze({
  wine_grapes:
    "JOIN wine_grapes {alias.wine_grapes} ON {alias.wine_grapes}.wine_id = wines.id",
});

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
   * @returns {Object[]}
   */
  extractKeywords(
    tokens,
    phraseMap,
    keywordMap,
    maxPhraseLength = MAX_PHRASE_LENGTH
  ) {
    /**
     * @property {object[]} phraseFilter SQL fragments associated with matched phrases
     * @property {object[]} keywordFilter SQL fragments associated with matched keywords
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
   * Expands table aliases into valid database table names. For queries that require
   * joins, this method attaches and immediately expands the 
   * relevant JOIN clause template from the `JOIN_REGISTRY`
   * 
   * @param {QueryFragment[]} fragments
   * @returns {Object[]}
   */
  expandAliases(fragments) {
    return fragments.map((fragment) => {
      return Object.assign(fragment, {
        condition: fragment.condition.replace(
          /\{alias\.([a-z_]+)\}/g,
          (_, key) => ALIAS[key]
        ),
        join: JOIN_REGISTRY[fragment.joinKey]?.replace(
          /\{alias\.([a-z_]+)\}/g,
          (_, key) => ALIAS[key]
        )
      });
    });
  },
  /**
   * Transforms a list of `QueryFragments` into a map of fragments grouped into SQL conditions or JOIN clauses
   * @param {QueryFragment[]} fragments - a list of
   * @returns {{joins: object[], conditions: object[]}}
   */
  planSQLQuery(fragments) {
    const joins = new Set();
    const conditions = [];

    for (const fragment of fragments) {
      conditions.push(fragment.condition);

      if (fragment.join) {
        joins.add(fragment.join);
      }
    }

    return {
      joins: [...joins],
      conditions,
    };
  },
  /**
   * @param {object} options - SQL fragments mapped to known keywords and phrases in the search vocabulary
   * @param {object} options.joins - a list of JOIN clauses
   * @param {object} options.conditions - a list of SQL conditions
   * @returns {string}
   */
  buildSQLQuery(options) {
    return Object.keys(options).length
      ? `SELECT wines.* FROM wines ${options.joins.join("\n")} ${options.conditions.length ? `WHERE ${options.conditions.join(" AND ")}` : ""}`
      : "";
  },
};

/**
 * Abstract class representing a search strategy
 */
class SearchStrategy {
  #vocabulary;

  constructor() {}

  /* node:coverage ignore next 3 */
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
  /* node:coverage ignore next 3 */
  constructor() {
    super();
  }

  /**
   *
   * @param {String} queryString - the raw search query from the client
   * @returns {Result<Object | Problem>}
   */
  search(queryString) {
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
      .map(queryTools.expandAliases)
      .map(queryTools.planSQLQuery)
      .map(queryTools.buildSQLQuery);

    if (sqlResult.isError()) {
      // TODO: Find a way to get the centralized logger into strategies
      console.error(`INTERNAL ERROR (ProductDiscoveryStrategy): **EXCEPTION ENCOUNTERED** while executing the search query. See details -> ${sqlResult.getError()}`);
      return Result.error(Problem.of({ 
        title: "INTERNAL ERROR",
        detail: "There was an error executing the search query." 
      }));
    }

    return queryRunner(sqlResult.value, this.constructor.name);
  }
}
