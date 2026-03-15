const Mock = {
  /**
   * Factory function building sandbox instances for testing application services
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

      ...overrides,
    };

    return sandbox;
  },
  /**
   * Creates a fake DB client compatible with Supabase calls
   */
  createMockDBClient() {
    return {
      /**
       *
       * @returns {object}
       */
      schema() {
        return {
          from() {
            return {
              async select() {
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
  createServiceHarness(Service, options) {
    let service;
    const sandbox = Mock.createApplicationSandbox();

    if (options) {
      Object.assign(sandbox.my, options);
    }

    service = new Service(sandbox);

    return {
      sandbox,
      service,
    };
  },
};

const Time = {
  delay(timeoutMillis) {
    return new Promise((resolve) => setTimeout(resolve, timeoutMillis));
  },
};

export const TestingTools = {
  Harness,
  Mock,
  Time,
};
