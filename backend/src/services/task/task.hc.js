import { parse } from "csv-parse/sync";
import { ApplicationService } from "../../../system.js";
import { Result } from "../../types/result.js";
import { Task } from "./task.js";

/**
 * @description Mapping task indentifiers to supported task types
 * @readonly
 */
const TASK_TYPES = Object.freeze({
  "tasks.test.noop": "TEST"
});

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
  #TaskProvider;
  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();

    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
    this.#TaskProvider = sandbox.my.TaskProvider;

    try {
     
    } catch (ex) {
      this.#logger.error(
        `INTERNAL_ERROR (TaskService): Exception encountered while starting the service. See details -> ${ex.message}`
      );
    }

  }
   
  /**
   * Creates and registers a new {@link Task}.
   * If no `taskFn` argument is provided, the `taskName` argument is used to lookup a cached task.
   * The `taskFn` defines the execution logic of the task and is invoked with 
   * the standard task contract:
   * `(input, abortSignal, taskHandle) => Promise<void>`
   * @param {string} taskName Human-readable name used for identification and logging.
   * @param {function(any, AbortSignal, TaskHandle): Promise<void>} [taskFn] an optional async function containing the task's execution logic.
   * @returns {Result<Task | Problem>} newly created and registered Task instance
   */
  createTask(taskName, taskFn) {
    let t;

    if (!taskFn) {
      const taskType = TASK_TYPES[taskName];
      const cachedTaskFn = this.#TaskProvider[taskType][taskName];
      t = new Task(cachedTaskFn, taskName);
    } else {
      t = new Task(taskFn, taskName);
    }

    this.#taskRegistry[t.id] = t;

    return Result.ok([t]);
  }
    
  /**
   * 
   * @param {string} id 
   * @returns {Result<Task>}
   */
  getTask(id) {
    return Result.ok([this.#taskRegistry[id]]);
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
