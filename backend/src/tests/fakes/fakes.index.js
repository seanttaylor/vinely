/**
 * A naive spy implementation for verifying and counting logger method calls
 */
const FakeLoggerImpl = (() => {
  const _callCount = {
    log: 0,
    error: 0
  };

  return {
    get callCount() {
      return _callCount;
    },
    log() {
      _callCount.log += 1;
    },
    info() {},
    warn() {},
    error() {},
  };
})();

/**
 * Application database implementation that only raises exceptions on query operations
 */
const FakeDatabaseImpl = {
  onQueryException: {
    schema() {
      return {
        from() {
          return {
            async select() {
              throw new Error("TEST_EXCEPTION_DATABASE_QUERY");
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
      throw new Error("TEST_EXCEPTION_DATABASE_RPC");
    },
  },
};

/**
 * Implementations for specified search strategy behaviors
 */
export const FakeSearchImpl = {
  async onSearchStrategyError(query, queryRunner) {
    return Result.error();
  },
  async onSearchStrategyException(query, queryRunner) {
    throw new Error("TEST_SEARCH_STRATEGY_EXCEPTION");
  },
};


export const mixinFakeLogger = {
  logger: {
    getLoggerInstance() {
      return FakeLoggerImpl;
    },
  },
  /**
   * Convenience method for accessing the fake logger implementations call count; necessary to ensure
   * the logger implementation remains hidden
   */
  get callCount() {
    return FakeLoggerImpl.callCount;
  },
};

/**
 * A database service whose client cannot be initialized
 */
export const mixinFakeBrokenSupabaseClient = {
  Database: {
    getClient: () => {
      throw new Error("TEST_EXCEPTION_DATABASE_CLIENT");
    },
  },
};

/**
 * A database service whose client methods only raise exceptions
 */
export const mixinFakeBrokenSupabaseClientOnlyThrows = {
  Database: {
    getClient: () => FakeDatabaseImpl.onQueryException,
  },
};

/**
 * A fake RPC interface that only raises exceptions 
 */
export const mixinFakeBrokenRPC = {
  async rpc() {
    throw new Error("TEST_EXCEPTION_DATABASE_RPC");
  },
};

/**
 * A fake RPC interface that only returns errors 
 */
export const mixinFakeRPCWithErrors = {
  /**
   * @returns {object}
   */
  async rpc() {
    return {
      error: {
        message: "TEST: The RPC client returned an error",
      },
    };
  }, 
};

/**
 *
 */
export const mixinFakeMiddleware = {
  MiddlewareProvider: {
    Telemetry: {
      /**
       * Generates the minimum required interface exception event consumers
       * @returns {object}
       */
      createExceptionEvent: () => ({
        detail: {
          header: {
            id: new Date().getTime(),
          },
        },
      }),
    },
  },
};
