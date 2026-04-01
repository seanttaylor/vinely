import { parse } from "csv-parse/sync";
import { Result } from "../types/result.js";
import { ApplicationService } from "../../system.js";

/**
 * @description Configuration for CSV Parse
 */
const CONFIG = {
  columns: true,
  skip_empty_lines: true,
};

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
        this.#logger.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);
        this.#logger.log({input});

        const csvString = input.file.buffer.toString("UTF-8");
        const records = parse(csvString, CONFIG);
        Result.ok(records).map(/* so much stuff */);
    }
  }
}
