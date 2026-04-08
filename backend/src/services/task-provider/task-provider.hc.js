import { parse } from "csv-parse/sync";
import { json2csv } from "json-2-csv";
import { Result } from "../../types/result.js";
import { ApplicationService } from "../../../system.js";
import { Events, SystemEvent } from "../../types/system-event.js";
import { Wine } from "../../schemas/vendor/zod/wine.zod.js";
import { TaskCapability } from "./task-capability.js";

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
  #TaskCapability;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();

    try {
      this.#logger = sandbox.core.logger.getLoggerInstance();
      const dbClient = sandbox.my.Database.getClient();
      const events = sandbox.my.Events;

      this.#TaskCapability = TaskCapability({ dbClient, events, logger: this.#logger });
    } catch (ex) {
      this.#logger.error(
        `INTERNAL_ERROR (TaskProvider): Exception encountered while starting the service. See details -> ${ex.message}`
      );
    }
  }

  /**
   * @description Namespaced system tasks associated with testing
   */
  INGEST = {
    /**
     * @param {object} input
     * @param {AbortSignal} signal
     * @param {TaskHandle}
     */
    "tasks.wines.bulk_import": async (input, signal, taskHandle) => {
      try {
        this.#logger.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);
        const capability = this.#TaskCapability.of(taskHandle.name);
        const csvString = input.file.buffer.toString("UTF-8");
        const records = parse(csvString, CONFIG);
        
        const normalizedWineList = Result.ok(records)
        .map(normalizeWines)
        .match({ err: (e) => {
          taskHandle.stop(`Stopped due to exception. See details -> ${e}`);
        }});

        const finalResult = Result.from(await capability.bulkImportWines(normalizedWineList))
        .match({ err: (e) => {
          taskHandle.stop(`Stopped due to exception. See details -> ${e}`);
        }});

        return finalResult;

      } catch(ex) {
        this.#logger.error(`INTERNAL ERROR (TaskProvider): **EXCEPTION ENCOUNTERED** while running task (${taskHandle.name}) as instance (${taskHandle.instance}). Task will be **STOPPED** See details -> ${ex.message}`);
        taskHandle.stop(ex.message);
      }
    },
    /**
     * Runs after new wines are imported to the database; maps the 
     * imported wines to grapes for ultimate insertion in a SQL join table
     * @param {object[]} input - a list of new imported wines from the database
     * @param {AbortSignal} signal
     * @param {TaskHandle}
     */
    "tasks.wines.map_wine_grapes": async (input, signal, taskHandle) => {
      const capability = this.#TaskCapability.of(taskHandle.name);
      const wineGrapeJoins = Result.from(await capability.getAllGrapes())
      .map((allGrapes) => {
        const wines = input.map((w) => ({id: w.id, grapes: w.grapes.split(",")}));
        const grapeDict = allGrapes.reduce((res, curr) => {
          res[curr.name] = curr;
          return res;
        }, {});

        return { grapes: grapeDict, wines };
      })
      .map(({ grapes, wines }) => {
        return wines.reduce((res, curr) => {
          const join = curr.grapes.map((g) => {
            return { wine_id: curr.id, grape_id: grapes[g].id }
          })
          return [... res, ...join];
        }, []);
      })
      .match({ 
        err:(e) => {
          this.#logger.error(`INTERNAL ERROR (Task): **EXCEPTION ENCOUNTERED** while executing task (${taskHandle.name}) See details -> ${e.message}`);
        }
      });

      Result.from(await capability.importWineGrapeMapping(wineGrapeJoins));

      console.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);
      taskHandle.onProgress({ message: "mapped wines to grapes for SQL join", status: "status.completed" })
    },
    /**
     * Task a csv file containing names of wines that will be imported; outputs
     * a template csv file prepopulated with wine names and empty columns corresponding
     * to the `wines` database table. Allows for quick scoring of wines and preparation of csv files for 
     * the bulk upload workflow
     * @param {object[]} input 
     * @param {AbortSignal} signal 
     * @param {TaskHandle} taskHandle 
     * @returns {Promise<object>} a CSV template for bulk importing wines
     */
    "tasks.wines.create_import_template": async(input, signal, taskHandle) => {
      this.#logger.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);
      const capability = this.#TaskCapability.of(taskHandle.name);
      const csvString = input.file.buffer.toString("UTF-8");
      const records = parse(csvString, CONFIG);
      const excludedRows = ["name", "id", "created_at"];

      const templateJSON = Result.from(await capability.getWines({ limit: 1 }))
      .map(([wine]) => {
        return records.map((r) => {
          return Object.keys(wine).reduce((res, keyName) => {
            if (excludedRows.includes(keyName)) {
              return res;
            }

            res[keyName] = null;
            return res;
          }, { name: r.name });  
        });
      })
      .match({
        err: (e) => taskHandle.stop(`Stopped due to exception. See details -> ${e.message}`)
      });

      const CSVTemplate = await json2csv(templateJSON);
      
      taskHandle.addAttachment({
        name: `wine-import-template`,
        mimeType: "text/csv",
        data: CSVTemplate,
      });
      
      // await capability.dispatchEvent(new SystemEvent(Events.WINE_IMPORT_TEMPLATE_CREATED, {
      //   template: CSVTemplate
      // }));

    },
  }

  TEST = {
    /**
     * @param {object} input
     * @param {AbortSignal} signal
     * @param {TaskHandle}
     */
    "tasks.test.noop": async (input, signal, taskHandle) => {
      console.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);
      taskHandle.onProgress({ message: "One to go!", status: "status.done" })
      return { foo: 42 }
    },
    /**
     * @param {object} input
     * @param {AbortSignal} signal
     * @param {TaskHandle}
     */
    "tasks.test.noop_2": async (input, signal, taskHandle) => {
      taskHandle.onProgress({ message: "Its a wrap!", status: "status.completed" })
      console.log(`running task (${taskHandle.name}) as instance (${taskHandle.instance})`);
    }
  }
}
