/* node:coverage disable */

/**
 * A naive spy implementation for verifying and counting logger method calls
 */
const FakeLoggerImpl = (options = { _callCount: { log: 0, error: 0 } }) => {
  return {
    get callCount() {
      return options._callCount;
    },
    log() {
      options._callCount.log += 1;
    },
    info() {},
    warn() {},
    error() {},
  };
};

/**
 * Application database client implementation that only raises exceptions on query operations
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

// TODO: Refactor after the Spies implementation is built
export const mixinFakeLogger = (() => {
  let _currentImpl;

  return {
    logger: {
      getLoggerInstance() {
        _currentImpl = FakeLoggerImpl();
        return _currentImpl;
      },
    },
    /**
     * Convenience method for accessing the fake logger implementations call count; necessary to ensure
     * the logger implementation remains hidden
     */
    getCallCount() {
      return _currentImpl.callCount;
    },
  };
})();

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
 * A fake RPC interface that returns stub data
 */
export const mixinFakeRPCWithData = {
  /**
   * @returns {object}
   */
  async rpc() {
    return {
      data: [
        {
          id: "2b133e71-6f82-4871-9e93-efeb2e52dfbd",
          created_at: "2026-03-02 01:04:49.121999+00",
          name: "Marques De Borba",
          color: "white",
          sparkling: false,
          minerality: 3,
          description:
            "The 2022/2023 vintage was marked by a warm winter, dry spring, and hot summer, contributing to an early and balanced grape maturation. The result is a fresh, aromatic, and well-structured white wine, embodying the unique conditions of Alentejo.",
          acidity: 1,
          body: "light",
          tags: null,
          vintage: "2024",
          tasting_notes:
            "Fresh citrus fruits like grapefruit and lemon, with subtle oak toast that complements rather than dominates the fruit. Vibrant freshness and mineral tension, with a smooth texture from extended lees aging. Balanced, elegant, and lingering finish.",
          producer_id: "ed8a1daa-c669-40ed-a1df-8d1934cc7f9c",
          price: 2,
          sweetness: 1,
        },
      ],
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
