/**
 * @callback SelectMockFn
 * @param {string} tableName - The table being queried
 * @param {...any} args - Arguments passed to the Supabase `select()` call
 * @returns {Promise<{data:any,error:any}>}
 */

import { keywords, phrases } from "./stubs/vocabulary.js";
import {
  mixinFakeBrokenSupabaseClientOnlyThrows,
  mixinFakeLogger,
  mixinFakeMiddleware,
  FakeSearchImpl,
  mixinFakeBrokenRPC,
  mixinFakeRPCWithData,
  mixinFakeRPCWithErrors,
} from "./fakes/fakes.index.js";

/**
 * A fake implementation for the select API of the
 * database client; returns only valid keywords and query phrases
 * @param {string} table database table name
 * @returns
 */
const getStubVocabulary = (table) =>
  table === "phrases"
    ? { data: phrases, error: null }
    : { data: keywords, error: null };

const getStubVocabularyWithPhraseErrors = (table) => {
  return table === "phrases"
    ? {
        data: null,
        error: "TEST: There was an error pulling phrases from the database",
      }
    : { data: keywords, error: null };
};

const getStubVocabularyWithTermsErrors = (table) => {
  return table === "terms"
    ? {
        data: null,
        error: "TEST: There wasn error pulling terms from the database",
      }
    : { data: phrases, error: null };
};

const Fakes = {
  /**
   * A database service whose client only returns successful queries with empty results
   */
  mixinFakeSupabaseClient: {
    Database: {
      getClient: () => Mock.createMockDBClient(),
    },
  },
  /**
   * A database service whose client returns valid records from the `vocabulary.terms` and `vocabulary.phrases` tables
   */
  mixinFakeSupabaseClientReturnsValidVocabulary: {
    Database: {
      getClient: () => Mock.createMockDBClient(getStubVocabulary),
    },
  },
  /**
   * A database service whose client returns an error querying records from the `vocabulary.phrases` table
   */
  mixinFakeSupabaseClientReturnsVocabularyPhraseErrors: {
    Database: {
      getClient: () =>
        Mock.createMockDBClient(getStubVocabularyWithPhraseErrors),
    },
  },
  /**
   * A database service whose client returns an error querying records from the `vocabulary.terms` table
   */
  mixinFakeSupabaseClientReturnsVocabularyTermsErrors: {
    Database: {
      getClient: () =>
        Mock.createMockDBClient(getStubVocabularyWithTermsErrors),
    },
  },
  /**
   * A database service whose RPC client only raises exceptions
   */
  mixinFakeBrokenSupabaseClientRPCOnlyThrows: {
    Database: {
      getClient: () =>
        Object.assign(Mock.createMockDBClient(), mixinFakeBrokenRPC),
    },
  },
  /**
   * A database service whose RPC client only returns errors
   */
  mixinFakeBrokenSupabaseClientRPCOnlyErrors: {
    Database: {
      getClient: () =>
        Object.assign(Mock.createMockDBClient(), mixinFakeRPCWithErrors),
    },
  },
  /**
   * A database service whose RPC client only returns valid data
   */
  mixinFakeBrokenSupabaseClientRPCOnlySuccess: {
    Database: {
      getClient: () =>
        Object.assign(Mock.createMockDBClient(), mixinFakeRPCWithData),
    },
  },
  mixinFakeBrokenSupabaseClientOnlyThrows,
  mixinFakeMiddleware,
  mixinFakeLogger,
  Strategy: {
    ...FakeSearchImpl,
  },
};

const Mock = {
  /**
   * Factory method building sandbox instances for testing application services
   * @param {object} overrides
   * @returns {object}
   */
  createApplicationSandbox(overrides = {}) {
    const sandbox = {
      core: {
        logger: {
          getLoggerInstance() {
            return {
              log() {},
              info() {},
              warn() {},
              error() {},
            };
          },
        },
      },

      my: {},
    };

    if (overrides) {
      Object.assign(sandbox.core, overrides);
    }

    return sandbox;
  },
  /**
   * Creates a fake DB client compatible with Supabase calls.
   * @description Mocks `select` method on the Supabase API; executes the provided `selectFn`. Any arguments to the Supabase client's `select` method at the call are forwarded to `selectFn`. The first positional
   * argument to `selectFn` is **always** the database table name.
   * @param {SelectMockFn} [selectFn] an optional implementation for a select call
   * @returns {object}
   */
  createMockDBClient(selectFn) {
    return {
      /**
       *
       * @returns {object}
       */
      schema() {
        return {
          /**
           * @param {string} tableName the database table name to query
           * @returns
           */
          from(tableName) {
            return {
              /**
               * Mocks `select` method on the Supabase API; executes the `selectFn` provided
               * to `createMockDBClient`; any arguments are forwarded. The first positional
               * argument to `selectFn` is **always** the database table name.
               * @param {string} tableName
               * @param  {...any} args
               * @returns
               */
              async select(...args) {
                if (selectFn) {
                  return selectFn(tableName, ...args);
                }

                return {
                  data: [],
                  error: null,
                };
              },
            };
          },
        };
      },
      /**
       *
       * @returns {object}
       */
      async rpc() {
        return {
          data: [],
          error: null,
        };
      },
    };
  },
  /**
   * Creates a fake search strategy
   * @param {function} [searchImpl] an optional implementation of a search strategy; used for
   * simulating different results from the search
   * @returns {object}
   */
  createMockSearchStrategy(searchImpl) {
    let _vocab;

    return {
      get vocabulary() {
        return _vocab;
      },
      setVocabulary(vocab) {
        _vocab = vocab;
      },
      /**
       *
       * @param {string} queryString
       * @param {function} queryRunner
       * @returns {Promise<Result>}
       */
      async search(queryString, queryRunner) {
        return searchImpl(queryString, queryRunner);
      },
    };
  },
};

const Harness = {
  /**
   * Builds a main test harness for all application services under test to consume
   * @param {object} Service constructor returning an application service instance
   * @param {object} [options] placeholder for any options we may implement later
   * @returns {{sandbox: object, service: object}}
   */
  createServiceHarness(Service, options = {}) {
    let service;
    const { core: coreOverrides, ...nonCoreOverrides } = options;
    const sandbox = Mock.createApplicationSandbox(coreOverrides);

    if (options) {
      Object.assign(sandbox.my, nonCoreOverrides);
    }

    service = new Service(sandbox);

    return {
      sandbox,
      service,
    };
  },
};

const Stubs = {};

const Time = {
  delay(timeoutMillis) {
    return new Promise((resolve) => setTimeout(resolve, timeoutMillis));
  },
};

export const TestingTools = {
  Fakes,
  Harness,
  Mock,
  Stubs,
  Time,
};
