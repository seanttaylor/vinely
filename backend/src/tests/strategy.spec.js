import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProductDiscoveryStrategy } from "../services/query/strategy.js";
import {
  keywords,
  phrases,
  mappedVocabularyKeywords,
  mappedVocabularyPhrases,
} from "../tests/stubs/vocabulary.js";
import { Result } from "../types/result.js";

describe("Product Search Strategies", () => {
  const SUPPORTED_SEARCH_STRATEGIES = new Set([
    "ProductDiscoveryStrategy",
    "ProductLookupStrategy",
  ]);
  const RESULT_SQL = {
    "cheap minerally whites":
      "SELECT wines.* FROM wines  WHERE price <= 2 AND minerality >= 3 AND color = 'white'",
    "cheap pinotage":
      "SELECT wines.* FROM wines JOIN wine_grapes wg ON wg.wine_id = wines.id WHERE price <= 2 AND wg.grape_id = '6762e998-598c-412f-91c5-99d0c2618562'",
  };
  const vocabulary = {
    keywords,
    phrases,
  };

  describe("ProductDiscovery", () => {
    it("Should FAIL to return search results when the strategy encounters an exception", async (t) => {
      const strategy = new ProductDiscoveryStrategy();
      const result =
        await strategy.search(/* INTENTIONALLY EMPTY SEARCH QUERY */);

      assert.equal(result instanceof Result, true);
      assert.equal(result.isError(), true);
      assert.equal(result.getError().title, "INTERNAL ERROR");
    });

    it("Should be able to validate the current strategy provided to the queryRunner is supported", async (t) => {
      const strategy = new ProductDiscoveryStrategy();
      await strategy.search("cheap minerally whites", onSearchQueryRun);

      function onSearchQueryRun(sqlString, strategyName) {
        assert.equal(
          strategyName,
          SUPPORTED_SEARCH_STRATEGIES.has(strategyName)
        );
        assert.equal(typeof sqlString, "string");
      }
    });

    it("Should be able to call the queryRunner with a valid SQL string", async (t) => {
      const strategy = new ProductDiscoveryStrategy();
      await strategy.search.call(
        { vocabulary, constructor: { name: "ProductDiscoveryStrategy" } },
        "fruity reds",
        onSearchQueryRun
      );

      /**
       * See .../services/query/query.hc.js for detailed type signature for this function
       * @param {string} sqlString
       * @param {string} strategyName
       */
      function onSearchQueryRun(sqlString, strategyName) {
        assert.equal(SUPPORTED_SEARCH_STRATEGIES.has(strategyName), true);
        assert.equal(typeof sqlString, "string");
        assert.equal(sqlString.trim(), "SELECT wines.* FROM wines");
      }
    });

    it("Should be able to run the strategy with an empty vocabulary and receive generic SQL select statement", async (t) => {
      const context = {
        vocabulary: { phrases: [], keywords: [] },
        constructor: { name: "ProductDiscoveryStrategy" },
      };
      const strategy = new ProductDiscoveryStrategy();
      await strategy.search.call(
        context,
        "cheap minerally whites",
        onSearchQueryRun
      );

      /**
       * See .../services/query/query.hc.js for detailed type signature for this function
       * @param {string} sqlString
       * @param {string} strategyName
       */
      function onSearchQueryRun(sqlString, strategyName) {
        assert.equal(SUPPORTED_SEARCH_STRATEGIES.has(strategyName), true);
        assert.equal(typeof sqlString, "string");
        assert.equal(sqlString.trim(), "SELECT wines.* FROM wines");
      }
    });

    it("Should be able to return an **EXPECTED** SQL query string to the query runner given a search including supported KEYWORDS", async (t) => {
      const queryString = "cheap minerally whites";
      const context = {
        vocabulary: {
          keywords: mappedVocabularyKeywords,
          phrases: mappedVocabularyPhrases,
        },
        constructor: { name: "ProductDiscoveryStrategy" },
      };
      const strategy = new ProductDiscoveryStrategy();
      strategy.setVocabulary(context.vocabulary);

      await strategy.search.call(context, queryString, onSearchQueryRun);

      /**
       * See .../services/query/query.hc.js for detailed type signature for this function
       * @param {string} sqlString
       * @param {string} strategyName
       */
      function onSearchQueryRun(sqlString, strategyName) {
        assert.equal(SUPPORTED_SEARCH_STRATEGIES.has(strategyName), true);
        assert.equal(typeof sqlString, "string");
        assert.equal(sqlString.trim(), RESULT_SQL[queryString]);
      }
    });

    it("Should be able to return an **EXPECTED** SQL query string to the query runner given a search including supported PHRASES", async (t) => {
      const queryString = "cheap pinotage";
      const context = {
        vocabulary: {
          keywords: mappedVocabularyKeywords,
          phrases: mappedVocabularyPhrases,
        },
        constructor: { name: "ProductDiscoveryStrategy" },
      };
      const strategy = new ProductDiscoveryStrategy();
      strategy.setVocabulary(context.vocabulary);

      await strategy.search.call(context, queryString, onSearchQueryRun);

      /**
       * See .../services/query/query.hc.js for detailed type signature for this function
       * @param {string} sqlString
       * @param {string} strategyName
       */
      function onSearchQueryRun(sqlString, strategyName) {
        assert.equal(SUPPORTED_SEARCH_STRATEGIES.has(strategyName), true);
        assert.equal(typeof sqlString, "string");
        assert.equal(sqlString.trim(), RESULT_SQL[queryString]);
      }
    });
  });

  describe.skip("ProductLookup", () => {});
});
