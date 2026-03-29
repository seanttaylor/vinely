import { ApplicationService } from "../../../system.js";
import { Result } from "../../types/result.js";
import { Task } from "./task.js";

/**
 * Central registry and factory for {@link Task} instances.
 * * `TaskService` is responsible for:
 * - creating new tasks from user-provided functions
 * - maintaining an in-memory registry of active and historical tasks
 * - providing access to all known tasks
 * 
 * It is the primary entry point for task lifecycle management
 *
 * @class TaskService
 */
export default class TaskService extends ApplicationService {
  static service = "TaskService";

  /**
   * Internal mapping of task IDs to Task instances.
   * @type {Object.<string, Task>}
   * @private
   */
  #taskRegistry = {};
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
      this.#logger.error(
        `INTERNAL_ERROR (TaskService): Exception encountered while starting the service. See details -> ${ex.message}`
      );
    }

    }
    /**
     * Creates and registers a new {@link Task}.
     *
     * The provided function defines the execution logic of the task and is
     * invoked with the standard task contract:
     * `(input, abortSignal, taskHandle) => Promise<void>`
     * @param {function(any, AbortSignal, TaskHandle): Promise<void>} taskFn Async function containing the task's execution logic.
     * @param {string} taskName Human-readable name used for identification and logging.
     * @returns {Result<Task | Problem>} newly created and registered Task instance
     */
    createTask(taskFn, taskName) {
      const t = new Task(taskFn, taskName);
      this.#taskRegistry[t.id] = t;

      return Result.ok([t]);
    }     

    /**
     * Returns all registered tasks; this includes tasks in 
     * any state (running, paused, stopped, completed).
     * @returns {Task[]}
     */
    get tasks() {
      return Object.values(this.#taskRegistry);
    }
}
