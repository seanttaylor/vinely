import express from "express";
import { Result } from "../../types/result.js";
import { Problem } from "../../types/problem.js";
import { SystemEvent, Events } from "../../types/system-event.js";

const HTTPResponse = {
  /**
   * 
   * @param {Object} res 
   * @returns {{success: Function, error: Function}}
   */
  with(res) {
    return {
      /**
       * @param {Object[]} data
       * @returns {void}
       */
      success(data) {
        res.set("X-Total-Count", data.length);
        res.json(data);
      },
      /**
       * @param {String|Object} error
       * @return {void}
       */
      error(error) {
        // res.set("X-Error-Instance-Id", "");
        res.set("X-Total-Count", 1);
        res.status(500);
        res.json([error]);
      },
    };
  },
};

/**
 * Router exposing endpoints for executing search queries
 */
export class QueryRouter {
  /**
   * @param {Object} options
   * @param {Object} options.middlewareProvider - object containing middleware methods
   * @param {Object} options.Events - interface for dispatching system events
   * @param {Object} options.QueryService - interface for executing search queries
   */
  constructor({ Events, QueryService }) {
    const router = express.Router();

    /**
     * Returns the application status
     */
    router.get("/search", async (req, res, next) => {
      try {
        /**
         * @type {Result<Object | Problem>}
         */
        const queryResult = await QueryService.search();
        const { success: onQuerySuccess, error: onQueryError } = HTTPResponse.with(res); 
        
        queryResult.match({ 
          ok: onQuerySuccess, 
          err: onQueryError 
        });
      } catch (ex) {
        const exceptionEvent = new SystemEvent(Events.RUNTIME_EXCEPTION, {
          service: "QueryRouter",
          message: ex.message,
          stack: ex.stack,
        });
        const logMessage = `INTERNAL_ERROR (QueryRouter): **EXCEPTION ENCOUNTERED** while executing a search query. This exception instance will be pushed to the 'telemetry.runtime_exceptions' table in the database with id (${exceptionEvent.detail.header.id}). See details -> ${ex.message}`;

        console.error(logMessage);
        Events.dispatchEvent(exceptionEvent);
        next(ex);
      }
    });

    return router;
  }
}
