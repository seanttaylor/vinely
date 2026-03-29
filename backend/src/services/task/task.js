import crypto from "node:crypto";
import pkg from 'randanimal';
import { STATUS } from "../../interfaces.js";

// Workaround for the package since it does not appear to support ES modules (e.g. it is written in CommonJS)
const { randanimalSync} = pkg;

/**
 * @typedef {Object} TaskProgressEventOptions
 * @property {string} message - Human-readable description of the event.
 * @property {string} status - The task status at the time of the event.
 * @property {Object<string, any>|null} [progress] - Optional structured progress payload
 * (e.g. percentages, counters, stage identifiers).
 */

/**
 * @typedef {Object} TaskHandleProgressOptions
 * @property {string} message - Human-readable description of the current progress state.
 * @property {string} status - The task status associated with this update.
 */

/**
 * Represents a single, immutable progress event emitted by a {@link Task}
 * during its lifecycle.
 *
 * A `TaskProgressEvent` captures a point-in-time update including status,
 * human-readable messaging, and optional structured progress metadata.
 * These events are appended to a Task's internal timeline and can be used
 * for auditing, debugging, or user-facing progress reporting.
 *
 * @class TaskProgressEvent
 *
 * @property {string} id - Unique identifier for the event (UUID).
 * @property {string} timestamp - ISO 8601 timestamp indicating when the event occurred.
 * @property {string} message - Human-readable description of the event.
 * @property {string} status - The task status at the time of the event.
 *
 * @remarks
 * - Instances are effectively immutable after construction.
 * - The `progress` field is intentionally unstructured to support diverse task types.
 * - Consumers should treat `status` as authoritative for state transitions.
 */

class TaskProgressEvent {
  #id;
  #message;
  #status;
  #timestamp;
  #progress;
  #rel;

  /**
   * @param {TaskProgressEventOptions} options
   */
  constructor({ message, status, rel, progress = null }) {
    this.#id = crypto.randomUUID();
    this.#message = message;
    this.#status = status;
    this.#timestamp = new Date().toISOString();
    this.#progress = progress;
    this.#rel = rel;
  }

  get id() {
    return this.#id;
  }

  get timestamp() {
    return this.#timestamp;
  }

  get message() {
    return this.#message;
  }

  get status() {
    return this.#status;
  }

  get progress() {
    return this.#progress;
  }

  toJSON() {
    return {
      id: this.#id,
      message: this.#message,
      status: this.#status,
      timestamp: this.#timestamp,
      rel: this.#rel
    };
  }
}

/**
 * Interface provided to a running task function that enables controlled
 * interaction with the underlying {@link Task} instance.
 *
 * A `TaskHandle` exposes a limited, safe API for:
 * - reporting progress updates
 * - stopping execution
 * - accessing task metadata
 *
 * It acts as a boundary between task business logic and the internal
 * state management of the Task system.
 *
 * @class TaskHandle
 *
 * @param {function(TaskHandleProgressOptions): void} progressFn
 * Function invoked when the task reports progress. Typically bound to the
 * owning Task's internal progress handler.
 *
 * @param {Object} taskContext - Reference to the owning Task instance.
 * Used internally to delegate control operations (e.g. stop).
 *
 * @property {string} taskContext.id - Unique identifier of the task.
 * @property {string} taskContext.instance - Human-friendly instance name of the task.
 * @property {string} taskContext.name - Logical name of the task.
 * @property {string} taskContext.timestamp - Timestamp associated with the task instance.
 *
 * @property {(options: TaskHandleProgressOptions) => void} onProgress
 * Reports a progress update to the task system. This will append a new
 * {@link TaskProgressEvent} to the task's timeline and update its status.
 *
 * @property {(message?: string) => void} stop
 * Requests termination of the running task. This triggers an abort signal
 * and records a terminal event in the task timeline.
 *
 * @remarks
 * - Consumers should treat this as the only interface for mutating task state.
 * - Direct mutation of Task internals is intentionally not possible.
 * - `onProgress` is the canonical mechanism for emitting state transitions.
 *
 */
class TaskHandle {
  constructor(progressFn, taskContext) {
    this.onProgress = ({ message, status }) => {
      progressFn({ message, status });
    };

    this.stop = (message) => {
      taskContext.stop(message);
    };
    this.id = taskContext.id;
    this.instance = taskContext.instance;
    this.createdAt = taskContext.createdAt;
    this.name = taskContext.name;
  }
}

/**
 * Represents a single executable unit of work managed by the Task system.
 *
 * A `Task` encapsulates:
 * - lifecycle state management (e.g. PAUSED → RUNNING → COMPLETED/STOPPED)
 * - execution of user-provided business logic
 * - progress/event tracking via an internal timeline
 * - cooperative cancellation via {@link AbortController}
 *
 * Task instances are created via {@link TaskService} and should not be
 * instantiated directly by consumers.
 *
 * @class Task
 *
 * @param {function(any, AbortSignal, TaskHandle): Promise<void>} taskFn
 * Async function containing the task's business logic. It receives:
 * - `input`: arbitrary input provided at start time
 * - `signal`: an {@link AbortSignal} for cooperative cancellation
 * - `taskHandle`: a {@link TaskHandle} for reporting progress and stopping the task
 *
 * @param {string} taskName - Logical name identifying the task type
 *
 * @property {string} id - Unique identifier for the task instance (UUID)
 * @property {string} instance - Human-friendly instance name (randomized)
 * @property {string} name - Logical task name
 * @property {string} createdAt - ISO 8601 timestamp when the task was created
 *
 * @property {TaskProgressEvent[]} log
 * Immutable timeline of all progress events emitted during execution
 *
 * @remarks
 * - Tasks are single-run and not restartable once in a terminal state.
 * - All state transitions **must** occur via `onProgress` or `stop`.
 * - The timeline (`log`) is append-only and represents the source of truth.
 * - Task execution is asynchronous and decoupled from the caller via the event loop.
 * - Consumers should treat `TaskHandle` as the only interface for interacting
 *   with a running task.
 */
export class Task {
  #createdAt = new Date().toISOString();
  #id = crypto.randomUUID();
  #instanceName = randanimalSync().toLowerCase().replace(' ', '-');
  #status = STATUS.PAUSED;
  #taskController = new AbortController();
  #timeline = [];
  #taskHandle;
  #taskFn;
  #taskName;

  constructor(taskFn, taskName) {
    this.#taskFn = taskFn;
    this.#taskName = taskName;
    this.#taskHandle = new TaskHandle(this.#onTaskProgress.bind(this), this);
  }

  get id() {
    return this.#id;
  }

  get instance() {
    return this.#instanceName;
  }

  get name() {
    return this.#taskName;
  }

  get createdAt() {
    return this.#createdAt;
  }

  get log() {
    return this.#timeline;
  }

  toJSON() {
    return {
      id: this.#id,
      createdAt: this.#createdAt,
      instance: this.#instanceName,
      status: this.#status,
      name: this.#taskName,
    };
  }

  /**
   * Indicates the task is in a terminal state (i.e. fully stopped or completed)
   * @returns {Boolean}
   */
  #isStopped() {
    return this.#status === STATUS.STOPPED || this.#status === STATUS.COMPLETED;
  }

  /**
   * Part of the taskHandle interface; passed to running task functions for
   * propagating progress info
   * @param {object} options
   * @param {string} options.message
   * @param {string} options.status
   * @returns {void}
   */
  #onTaskProgress({ message, status }) {
    if (this.#isStopped()) {
      return;
    }

    this.#status = status;
    this.#timeline.push(
      new TaskProgressEvent({
        message,
        status,
        rel: this.#taskName
      })
    );
  }

  /**
   * Starts a task run
   * @param {Any} input - input consumed by the task
   */
  async start(input) {
    try {
      this.#status = STATUS.RUNNING;
      this.#timeline.push(
        new TaskProgressEvent({
          message: "We're live!",
          status: STATUS.RUNNING,
          rel: this.#taskName
        })
      );

      const runTask = async () => {
        if (this.#isStopped()) {
          return;
        }

        await this.#taskFn(
          input,
          this.#taskController.signal,
          this.#taskHandle
        );
      };

      setTimeout(async () => {
        try {
          await runTask();
        } catch (ex) {
          console.error(
            `INTERNAL ERROR (Task): **UNCAUGHT EXCEPTION ENCOUNTERED** while executing task (${
              this.#taskName
            }). See details -> ${ex.message}`
          );
        }
      }, 0);
    } catch (ex) {
      console.error(
        `INTERNAL ERROR (Task): **EXCEPTION ENCOUNTERED** while starting the task. See details -> ${ex.message}`
      );
    }
  }

  /**
   * Stop a running task
   * @param {string} message
   */
  stop(message = null) {
    if (this.#isStopped()) {
      return;
    }

    this.#taskController.abort(message);
    this.#status = STATUS.STOPPED;
    this.#timeline.push(
      new TaskProgressEvent({
        message,
        status: STATUS.STOPPED,
        rel: this.#taskName
      })
    );
  }
}