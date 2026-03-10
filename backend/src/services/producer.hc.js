import { ApplicationService } from "../../system.js";

/**
 *
 */
export default class ProducerService extends ApplicationService {
  static service = "ProducerService";

  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();

    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
    try {
    } catch (ex) {
      console.error(
        `INTERNAL_ERROR (ProducerService): Exception encountered while starting the service. See details -> ${ex.message}`
      );
    }
  }
}
