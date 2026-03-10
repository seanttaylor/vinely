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
       * @param {Problem} error
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
 * Router exposing endpoints for wine management
 */
export class WineRouter {
  /**
   * @param {Object} options
   * @param {Object} options.middlewareProvider - object containing middleware methods
   * @param {Object} options.Events - interface for dispatching system events
   * @param {Object} options.MiddlewareProvider common interface for service middleware
   * @param {Object} options.WineService
   */
  constructor({ Events, MiddlewareProvider, WineService }) {
    const router = express.Router();

    /**
     * @param {Object} req
     * @param {Object} res
     * @param {Function} next
     */
    router.get("/wines", async (req, res, next) => {
      try {
        const queryResult = await WineService.find();
        const { success: onQuerySuccess, error: onQueryError } =
          HTTPResponse.with(res);

        queryResult.match({
          ok: onQuerySuccess,
          err: onQueryError,
        });
      } catch (ex) {
        const { error: onQueryError } = HTTPResponse.with(res);

        Result.ok(
          MiddlewareProvider.Telemetry.createExceptionEvent({
            service: "WineRouter",
            ex,
          })
        )
          .tap((exceptionEvent) => {
            console.error(
              `INTERNAL_ERROR (WineRouter): **EXCEPTION ENCOUNTERED** while executing a search query. This exception instance will be pushed to the 'telemetry.runtime_exceptions' table in the database with id (${exceptionEvent.detail.header.id}). See details -> ${ex.message}`
            );
            Events.dispatchEvent(exceptionEvent);
          })
          .map((exceptionEvent) =>
            Result.error(
              Problem.of({
                title: "INTERNAL ERROR",
                detail: "There was an error while executing the search query.",
                instance: `runtime_exceptions/wine_router/${exceptionEvent.detail.header.id}`,
              })
            )
          )
          .match({
            err: onQueryError,
          });
      }
    });

    return router;
  }
}
