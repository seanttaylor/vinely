import express from "express";
import { Result } from "../../types/result.js";
import { Problem } from "../../types/problem.js";

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
      success(data, statusCode=200) {
        res.set("X-Total-Count", data.length);
        res.status(statusCode);
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
 * Router exposing endpoints for managing async tasks
 */
export class TaskRouter {
  /**
   * @param {object} Events - the `Events` interface
   * @param {object} TaskService - the `TaskService` interface
   * @param {object} MiddlewareProvider - the `MiddlewareProvider` interface
   */
  constructor({ Events, TaskService, MiddlewareProvider }) {
    const router = express.Router();
    
    router.post("/tasks", async (req, res) => {
      try { 
        throw new Error('what...?')
        const taskResult = TaskService.createTask(async (input, signal, taskHandle) => {
          console.log(`running task(${taskHandle.name})`);
        }, "tasks.test.noop");

        const { success: onReqSuccess, error: onReqError } = HTTPResponse.with(res);
        taskResult.match({
          ok: (data) => onReqSuccess(data, 201),
          err: onReqError,
        });

      } catch(ex) {
        const { error: onQueryError } = HTTPResponse.with(res); 
        
        Result.ok(MiddlewareProvider.Telemetry.createExceptionEvent({
          service: "TaskService",
          ex,
        }))
        .tap((exceptionEvent) => {
          console.error(`INTERNAL_ERROR (TaskService): **EXCEPTION ENCOUNTERED** while creating a task. This exception instance will be pushed to the 'telemetry.runtime_exceptions' table in the database with id (${exceptionEvent.detail.header.id}). See details -> ${ex.message}`);
          Events.dispatchEvent(exceptionEvent);
        })
        .map((exceptionEvent) => Result.error(Problem.of({
            title: "INTERNAL ERROR",
            detail: "There was an error while creating or executing a task.",
            instance: `runtime_exceptions/task_router/${exceptionEvent.detail.header.id}`,
          })))
        .match({
          err: onQueryError 
        });
      }
    });

    /**
     * 
     */
    router.get("/", (req, res) => {
      res.status(204).send();
    });

    return router;
  }
}
