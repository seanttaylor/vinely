import { ApplicationService } from "../../../system.js";
import { Result } from "../../types/result.js";
import { Task } from "./task.js";

/**
 * @description Mapping task indentifiers to supported task types
 * @readonly
 */
const TASK_TYPES = Object.freeze({
  "tasks.wines.bulk_import": "INGEST",
  "tasks.test.noop": "TEST",
  "tasks.test.noop_2": "TEST"
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
   * @param {object} runtimeTaskConfig configuratin that influences task behavior during execution
   * @param {function(any, AbortSignal, TaskHandle): Promise<void>} [taskFn] an optional async function containing the task's execution logic.
   * @returns {Result<Task | Problem>} newly created and registered Task instance
   */
  createTask(taskName, runtimeTaskConfig, taskFn) {
    let taskInstances;

    if (taskFn) {
      taskInstances = [new Task(taskFn, taskName)];
      this.#taskRegistry[t.id] = t;
      return Result.ok(t);
    }

    const nextTasks = runtimeTaskConfig.nextTasks || [];
    const requestedTasks = [ taskName, ...nextTasks ];

    taskInstances = requestedTasks.map((tn) => {
      const taskType = TASK_TYPES[tn];
      const myTask = new Task(this.#TaskProvider[taskType][tn], tn);
      this.#taskRegistry[myTask.id] = myTask;
      return myTask;
    });

    return Result.ok(taskInstances).map((instances) => {
      // The task request is a workflow
      if (instances.length > 1) {
        const [initialTask, ...remaining] = instances;

        //Workflow.from(initialTask, remainingTasks);
        Object.assign(initialTask, { 
          start: async (input) => {
            const result = await Task.prototype.start.call(initialTask, input);

            await remaining.reduce(async (res, currentTask) => {
              try {
                return await currentTask.start(res);
              } catch(ex) {
                this.#logger.error(`INTERNAL ERROR (Task): **EXCEPTION ENCOUNTED** while running task $${ex.message}`);
              }
            }, result);
          },
          // Customized `toJSON` method to ensure *ALL* tasks created in a
          // workflow are surfaced when returning API responses or logging
          // the initial task of a workflow
          toJSON() {
            return instances.map(task => ({
              id: task.id,
              createdAt: task.createdAt,
              instance: task.instance,
              name: task.name, 
              status: task.status
            }));
          }
        });
        return [initialTask];
      }
      return instances;
    })
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
