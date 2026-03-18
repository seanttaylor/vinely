import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { TestingTools } from "./testing.tools.js";
import QueryService from "../../src/services/query/query.hc.js";

import { Result } from "../types/result.js";
import { Problem } from "../types/problem.js";

/******** DOUBLES ********/
import { mixinEvents } from "./doubles/doubles.index.js";

/******** FAKES ********/
const {
  mixinFakeSupabaseClient,
  mixinFakeBrokenSupabaseClient,
  mixinFakeBrokenSupabaseClientOnlyThrows,
  mixinFakeBrokenSupabaseClientRPCOnlyThrows,
  mixinFakeBrokenSupabaseClientRPCOnlyErrors,
  mixinFakeSupabaseClientReturnsVocabularyErrors,
  mixinFakeSupabaseClientReturnsValid,
  mixinFakeLogger,
  mixinFakeMiddleware,
} = TestingTools.Fakes;

/******** SPIES ********/
const createSpy = (options = { _callCount: 0 }) => ({
  get callCount() {
    return options._callCount;
  },
  get calls() {
    return {
      args: options._args,
    };
  },
  /**
   *
   * @param {string} queryString
   * @param {function} queryRunner
   */
  onSearchStrategyRun: (queryString, queryRunner) => {
    options._callCount += 1;
    options._args = { queryString, queryRunner };
    return queryRunner(queryString, "ATestStrategy");
  },
});


/******** HELPERS ********/
const getServiceHarness = (service, overrides) =>
  TestingTools.Harness.createServiceHarness(service, overrides);

const DEFAULT_TIMEOUT_MILLIS = 1350;

describe("QueryService", () => {
  it("Should instantiate QueryService", () => {
    const { service } = getServiceHarness(
      QueryService,
      mixinFakeSupabaseClient
    );
    assert.ok(service);
  });

  it("Should return SERVICE UNAVAILABLE when service is not ready", async () => {
    const { service } = getServiceHarness(
      QueryService,
      mixinFakeSupabaseClient
    );

    const result = await service.search("red wine");

    assert.equal(service.ready, false);
    assert.equal(result.isError(), true);
    assert.equal(result.getError().title, "SERVICE UNAVAILABLE");
  });

  it("Should FAIL to create the service when an exception is raised during instantiation", (t) => {
    assert.throws(() => {
      const { service } = getServiceHarness(
        QueryService,
        mixinFakeBrokenSupabaseClient
      );
    });
  });

  it("Should FAIL to create the service when the loading vocabulary encounters an exception", async (t) => {
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeBrokenSupabaseClientOnlyThrows,
      core: { ...mixinFakeLogger },
    });

    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);
    assert.equal(mixinFakeLogger.callCount.log, 1);
  });

  it("Should be able to set the search strategy", async (t) => {
    const { service } = getServiceHarness(
      QueryService,
      mixinFakeSupabaseClient
    );
    // We await to allow the QueryService constructor time to load the vocabulary from the database
    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);
    /**
     * @description An empty stub of the vocabulary map compiled by the QueryService constructor
     * @note This stub satisfies this unit test because the fakeDbClient returns empty lists for
     * keywords and phrases, verifying the a vocab can be pulled and stored in the service for
     * use by search strategies
     */
    const vocabularyStub = {
      keywords: {},
      phrases: {},
    };

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy();
    service.setStrategy(mockStrategy);

    assert.ok(mockStrategy.vocabulary !== undefined);
    assert.deepStrictEqual(mockStrategy.vocabulary, vocabularyStub);
  });

  it("Should be able to receive an error Result type if the current strategy produces an error", async () => {
    const strategy = TestingTools.Fakes.Strategy.onSearchStrategyError;
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeSupabaseClient,
      ...mixinFakeMiddleware,
      ...mixinEvents,
    });
    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy(strategy);
    service.setStrategy(mockStrategy);

    const result = await service.search("cabernet");
    assert.equal(result instanceof Result, true);

    assert.ok(result.isError());
  });

  it("Should be able to receive an error Result type if the current strategy throws an exception", async () => {
    const strategy = TestingTools.Fakes.Strategy.onSearchStrategyException;
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeSupabaseClient,
      ...mixinFakeMiddleware,
      ...mixinEvents,
    });
    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy(strategy);
    service.setStrategy(mockStrategy);

    const result = await service.search("cabernet");

    assert.equal(result instanceof Result, true);
    assert.ok(result.isError(), true);
    assert.equal(result.getError() instanceof Problem, true);

    const { title, detail } = result.getError();

    assert.equal(title, "INTERNAL ERROR");
    assert.equal(
      detail,
      "There was an error while executing the search query."
    );
  });

  it("Should FAIL when the query runner encounters an exception", async () => {
    const spy = ((options = { _callCount: 0 }) => ({
      get callCount() {
        return options._callCount;
      },
      get calls() {
        return {
          args: options._args,
        };
      },
      /**
       *
       * @param {string} queryString
       * @param {function} queryRunner
       */
      onSearchStrategyRun: (queryString, queryRunner) => {
        options._callCount += 1;
        options._args = { queryString, queryRunner };
        return queryRunner(queryString, "ATestStrategy");
      },
    }))();
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeBrokenSupabaseClientRPCOnlyThrows,
      ...mixinFakeMiddleware,
      ...mixinEvents,
    });
    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy(
      spy.onSearchStrategyRun
    );
    service.setStrategy(mockStrategy);

    const result = await service.search("cheap minerally whites");

    assert.equal(spy.callCount, 1);
    assert.equal(typeof spy.calls.args.queryString, "string");
    assert.equal(typeof spy.calls.args.queryRunner, "function");

    assert.equal(result instanceof Result, true);
    assert.ok(result.isError());
  });

  it("Should FAIL when the query runner returns an error", async () => {
    const spy = createSpy();
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeBrokenSupabaseClientRPCOnlyErrors,
      ...mixinFakeMiddleware,
      ...mixinEvents,
    });
    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy(
      spy.onSearchStrategyRun
    );
    service.setStrategy(mockStrategy);

    const result = await service.search("cheap minerally whites");

    assert.equal(spy.callCount, 1);
    assert.equal(typeof spy.calls.args.queryString, "string");
    assert.equal(typeof spy.calls.args.queryRunner, "function");

    assert.equal(result instanceof Result, true);
    assert.ok(result.isError());
  });

  it("Should FAIL to create the service and log when loading the vocabulary map encounters an error", async (t) => {
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeSupabaseClientReturnsVocabularyErrors,
      ...mixinFakeMiddleware,
      ...mixinEvents,
      core: { ...mixinFakeLogger },
    });

    await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);

    assert.equal(mixinFakeLogger.callCount.log, 1);
  });
  //
});
