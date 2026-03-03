import { token } from "morgan";
import { Result } from "../../types/result.js";

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
  extractPhrases() {},
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

    console.log(queryFilters);

    throw new Error("Some random error");
    return Result.ok({
      queryResult: "Some random result",
    });
  }
}
