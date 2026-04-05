import express from "express";
import multer from "multer";

import { Result } from "../../types/result.js";
import { Problem } from "../../types/problem.js";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }, 
});

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
        res.json(...data);
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
    
    router.post("/tasks", upload.single("file"), MiddlewareProvider.TaskService.normalizeMultipart, MiddlewareProvider.Validation.validateRequestBody, async (req, res) => {
      try { 
        const taskName = req.body.name;
        const { payload, ...runtimeTaskConfig } = req.body;
        const { success: onReqSuccess, error: onReqError } = HTTPResponse.with(res);
        const taskResult = TaskService.createTask(taskName, runtimeTaskConfig);
        
        taskResult.match({
          ok: (data) => onReqSuccess(data, 201),
          err: onReqError,
        });

        /******** TASK LIFECYCLE MANAGEMENT *********/
        if (req.body.autoStart) {
          taskResult.tap(([t]) => {
            t.start(payload);
          });
        }
        
        if (req.body.scheduledAt) {
          const timeout =  new Date(req.body.scheduledAt).getTime() - Date.now();

          setTimeout(() => {
            taskResult.tap(([t]) => {
              t.start(payload);
            });
          }, timeout);
        }

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
    router.get("/tasks", async (req, res) => {
      const { success: onReqSuccess, error: onReqError } = HTTPResponse.with(res);
      const taskListResult = Result.ok(TaskService.tasks)
      .match({ok: onReqSuccess, err: onReqError});
    });

    /**
     * 
     */
    router.get("/tasks/:id", async (req, res) => {
      try {
      const { id } = req.params;
      const { success: onReqSuccess, error: onReqError } = HTTPResponse.with(res);

      const taskResult = TaskService.getTask(id);

      taskResult.match({ ok: onReqSuccess, err: onReqError }); 
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
    router.get("/tasks/:id/timeline", async (req, res) => {
      try {
      const { id } = req.params;
      const { success: onReqSuccess, error: onReqError } = HTTPResponse.with(res);
      const taskResult = TaskService.getTask(id).map(([t])=> t.log);

      taskResult.match({ ok: onReqSuccess, err: onReqError }); 
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
            detail: "There was an error while retrieving a task.",
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
    router.put("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { success: onReqSuccess, error: onReqError } = HTTPResponse.with(res);
        const taskResult = TaskService.getTask(id);

        const myTask = taskResult.map(([t]) => t.start(req.body.payload))
        .match({
          ok:()=> onReqSuccess([], 204), 
          err: (e)=> onReqError(Problem.of({ 
            title: "INTERNAL ERROR", 
            detail: `There was an error starting the task (${req.params.id})` 
          })) 
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
            detail: "There was an error while executing a task.",
            instance: `runtime_exceptions/task_router/${exceptionEvent.detail.header.id}`,
          })))
        .match({
          err: onQueryError 
        });
      }
    });

    

    return router;
  }
}
