import { ApplicationService } from "../../system.js";
import { SystemEvent, Events } from "../types/system-event.js";
import { Result } from "../types/result.js";
import { Problem } from "../types/problem.js";

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
   * @returns {Result<Object | Problem>}
   */
  search(queryString) {
    try {
      //throw new Error("Some random exception");
      return Result.ok({
        queryResult: "Some random result",
      });
    } catch (ex) {
      const exceptionEvent = new SystemEvent(Events.RUNTIME_EXCEPTION, {
        service: QueryService.service,
        message: ex.message,
        stack: ex.stack,
      });
      const exceptionId = exceptionEvent.detail.header.id;
      const logMessage = `INTERNAL_ERROR (${QueryService.service}): **EXCEPTION ENCOUNTERED** while executing a search query. This exception instance will be pushed to the 'telemetry.runtime_exceptions' table in the database with id (${exceptionId}). See details -> ${ex.message}`;
      const displayMessage =
        "There was an error while executing the search query.";

      console.error(logMessage);
      this.#sandbox.my.Events.dispatchEvent(exceptionEvent);
      return Result.error(
        Problem.of({
          title: "INTERNAL ERROR",
          detail: displayMessage,
          instance: `runtime_exceptions/query_serice/${exceptionId}`,
        })
      );
    }
  }
}
