import assert from "node:assert/strict";
import { describe, it} from "node:test";
import { ProductDiscoveryStrategy } from "../services/query/strategy.js";
import { keywords, phrases } from "../tests/stubs/vocabulary.js";
import { Result } from "../types/result.js";

describe("Product Search Strategies", () => {
  const SUPPORTED_SEARCH_STRATEGIES = new Set(["ProductDiscoveryStrategy", "ProductLookupStrategy"]);
  const vocabulary = {
    keywords,
    phrases
  };

  describe("ProductDiscovery", () => {
    it("Should FAIL to return search results when the strategy encounters an exception", async (t) => {
      const strategy = new ProductDiscoveryStrategy();
      const result = await strategy.search(/* INTENTIONALLY EMPTY SEARCH QUERY */);

      assert.equal(result instanceof Result, true);
      assert.equal(result.isError(), true);
      assert.equal(result.getError().title, "INTERNAL ERROR");
    });

    it("Should be able to validate the current strategy provided to the queryRunner is supported", async (t) => {
      const strategy = new ProductDiscoveryStrategy();
      await strategy.search(
        "cheap minerally whites",
        onSearchQueryRun
      );

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
      await strategy.search.call({ vocabulary, constructor: { name: "ProductDiscoveryStrategy" }},"cheap minerally whites", onSearchQueryRun);

      /**
       * See .../services/query/query.hc.js for detailed type signature for this function
       * @param {string} sqlString 
       * @param {string} strategyName
       */ 
      function onSearchQueryRun(sqlString, strategyName) {
        assert.equal(
          SUPPORTED_SEARCH_STRATEGIES.has(strategyName),
          true
        );
        assert.equal(typeof sqlString, "string");
        assert.equal(sqlString.trim(), "SELECT wines.* FROM wines");
      }
    });
  });

  describe.skip("ProductLookup", () => {
   
  });
});
