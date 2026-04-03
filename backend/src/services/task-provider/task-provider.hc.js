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

  #dbClient;
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
      this.#dbClient = sandbox.my.Database.getClient();
    } catch (ex) {
      this.#logger.error(
        `INTERNAL_ERROR (TaskProvider): Exception encountered while starting the service. See details -> ${ex.message}`
      );
    }
  }

  /**
   * @description Methods encapsulating discrete database operations; ensures
   * running tasks do not have access the entire databse API surface
   */
  #DB_TASKS = {
    /**
     * @param {object[]} wineList - list of validated wines to push to the database
     * @returns {object[]}
     */
    bulkImportWines: async (wineList) => {
      try {
        throw new Error('Uh oh')
        const { data, error } = await this.#dbClient.from('wines').insert(wineList).select();

        if (error) {
          return Result.error(error.message);
        }

        return data.length ? data : [];
        
      } catch(ex) {
        this.#logger.error(`INTERNAL ERROR (TaskProvider): **EXCEPTION ENCOUNTERED** while bulk importing wines. See details => ${ex.message}`);
        return Result.error("There was an error");
      }
    }
  }

  /**
   * @description Namespaced system tasks associated with testing
   */
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
        .match({ err: (e) => {
          taskHandle.stop(`Stopped due to exception. See details -> ${e}`);
        }});

        const finalResult = Result.from(await this.#DB_TASKS.bulkImportWines(normalizedResult))
        .match({ err: (e) => {
          taskHandle.stop(`Stopped due to exception. See details -> ${e}`);
        }});

      } catch(ex) {
        this.#logger.error(`INTERNAL ERROR (TaskProvider): **EXCEPTION ENCOUNTERED** while running task (${taskHandle.name}) as instance (${taskHandle.instance}). Task will be **STOPPED** See details -> ${ex.message}`);
        taskHandle.stop(ex.message);
      }
    }
  }
}
