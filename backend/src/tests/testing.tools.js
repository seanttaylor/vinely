
const Mock = {
  /**
   * Factory function building sandbox instances for testing application services
   * @param {object} overrides 
   * @returns {object}
   */
  createApplicationSandbox(overrides={}) {
    const sandbox = {
      core: {
        logger: {
          getLoggerInstance() {
            return {
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
  }
};

const Harness = {
  /**
   * Builds a main test harness for all application services under test to consume
   * @param {object} Service constructor returning an application service instance
   * @param {object} options placeholder for any options we may implement later
   * @returns {{sandbox: object, service: object}}
   */
  createServiceHarness(Service, options={}) {

    const sandbox = Mock.createApplicationSandbox();
    const service = new Service(sandbox);

    return {
      sandbox,
      service,
    };
  }
};

export const TestingTools = {
  Mock,
  Harness
}


