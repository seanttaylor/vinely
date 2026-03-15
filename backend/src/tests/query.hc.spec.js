import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { TestingTools } from "./testing.tools.js";
import QueryService from "../../src/services/query/query.hc.js";

import { Result } from "../types/result.js";
import { SystemEvent, Events } from "../types/system-event.js";
import { Problem } from "../types/problem.js";

const getServiceHarness = (service, overrides = {}) =>
  TestingTools.Harness.createServiceHarness(service, overrides);

/******** MIXINS ********/
const mixinFakeSupabaseClient = {
  Database: {
    getClient: () => TestingTools.Mock.createMockDBClient(),
  },
};

const mixinEvents = {
  Events: {
    dispatchEvent: () => ({/* does nothing, goes nowhere */})
  }
};

const mixinFakeMiddleware = {
  MiddlewareProvider: {
    /**
     * @note We have some **minor** duplication here with `createExceptionEvent` in the interest of keeping
     * tests atomic; if it duplicates become unwieldy, directly important necessary middleware functions
     */
    Telemetry: {
      createExceptionEvent: ({ service, ex }) =>
        new SystemEvent(Events.RUNTIME_EXCEPTION, {
          service,
          ex,
        }),
    },
  },
};

/******** FAKE SEARCH IMPLEMENATIONS ********/
const FakeSearchImpl = {
  async onSearchStrategyError(query, queryRunner) {
    return Result.error();
  },
  async onSearchStrategyException(query, queryRunner) {
    throw new Error("TEST_SEARCH_STRATEGY_EXCEPTION");
  },
};

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

  it("Should be able to set the search strategy", async (t) => {
    const { service } = getServiceHarness(
      QueryService,
      mixinFakeSupabaseClient
    );
    // We await to allow the QueryService constructor time to load the vocabulary from the database
    await TestingTools.Time.delay(1000);
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
    const { service } = getServiceHarness(
      QueryService,
      mixinFakeSupabaseClient
    );
    await TestingTools.Time.delay(1000);

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy(
      FakeSearchImpl.onSearchStrategyError
    );
    service.setStrategy(mockStrategy);

    const result = await service.search("cabernet");
    assert.equal(result instanceof Result, true);

    assert.ok(result.isError());
  });

  it("Should be able to receive an error Result type if the current strategy throws an exception", async () => {
    const { service } = getServiceHarness(QueryService, {
      ...mixinFakeSupabaseClient,
      ...mixinFakeMiddleware,
      ...mixinEvents
    });
    await TestingTools.Time.delay(1000);

    const mockStrategy = TestingTools.Mock.createMockSearchStrategy(
      FakeSearchImpl.onSearchStrategyException
    );
    service.setStrategy(mockStrategy);

    const result = await service.search("cabernet");

    assert.equal(result instanceof Result, true);
    assert.ok(result.isError(), true);
    
    assert.equal(result.getError() instanceof Problem, true);

    const { title, detail } = result.getError();

    assert.equal(title, "INTERNAL ERROR");
    assert.equal(detail, "There was an error while executing the search query.");
  });
});
