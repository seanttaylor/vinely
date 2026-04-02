import { parse } from "csv-parse/sync";
import { Result } from "../../types/result.js";
import { ApplicationService } from "../../../system.js";
import { Wine } from "../../schemas/vendor/zod/wine.zod.js";

/**
 * @description Configuration for CSV Parse
 */
const CONFIG = {
  columns: true,
  skip_empty_lines: true,
};

/**
 * Post-processing step for bulk importing wines via CSV file for example. Since
 * CSV extraction casts all values as strings we must re-cast field values to
 * the correct types for downstream processing.
 * @param {object[]} input - list of wine records 
 * @returns {object[]}
 */
const normalizeWines = (input) => {
  return input.map(Wine.from); 
}

/**
 * Houses implementation details of all supported system tasks
 */
export default class TaskProvider extends ApplicationService {
  static service = "TaskProvider";

  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();

    try {
        this.#sandbox = sandbox;
        this.#logger = sandbox.core.logger.getLoggerInstance();
    } catch (ex) {
      this.#logger.error(
        `INTERNAL_ERROR (TaskProvider): Exception encountered while starting the service. See details -> ${ex.message}`
      );
    }
  }

  TEST = {
    /**
     * @param {object} input
     * @param {AbortSignal} signal
     * @param {TaskHandle}
     */
    "tasks.test.noop": async (input, signal, taskHandle) => {
      try {
        this.#logger.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);

        const csvString = input.file.buffer.toString("UTF-8");
        const records = parse(csvString, CONFIG);
        const normalizedResult = Result.ok(records)
        .map(normalizeWines)
      } catch(ex) {
        this.#logger.error(`INTERNAL ERROR (TaskProvider): **EXCEPTION ENCOUNTERED** while running task (${taskHandle.name}) as instance (${taskHandle.instance}). Task will be **STOPPED** See details -> ${ex.message}`);
        taskHandle.stop(ex.message);
      }
    }
  }
}
