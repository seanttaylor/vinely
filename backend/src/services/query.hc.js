import { ApplicationService } from "../../system.js"
import { SystemEvent, Events } from "../types/system-event.js";

/**
 * Manages the vinely search pipeline end-to-end
 */
export default class QueryService extends ApplicationService {
  static service = "QueryService";

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
        `INTERNAL_ERROR (${QueryService.service}): **EXCEPTION ENCOUNTERED** while starting the service. See details -> ${ex.message}`
      );
    }
  }

  /**
   *
   * @param {String} queryString - the raw search query from the client
   * @returns {Result<Object>}
   */
  search(queryString) {
    try {
      throw new Error("Some random exception");
      return {
        result: "Some random result"
      };
    } catch (ex) {
      const exceptionEvent = new SystemEvent(Events.RUNTIME_EXCEPTION, {
        service: QueryService.service,
        message: ex.message,
        stack: ex.stack,
      });

      console.error(
        `INTERNAL_ERROR (${QueryService.service}): **EXCEPTION ENCOUNTERED** while executing a search query. This exception instance will be pushed to the 'runtime_exceptions' table in the database with id (${exceptionEvent.detail.header.id}). See details -> ${ex.message}`
      );
    
      this.#sandbox.my.Events.dispatchEvent(exceptionEvent);
      return {};
    }
  }
}
