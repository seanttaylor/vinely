import { Result } from "../../types/result.js";
import { taskConfig } from "./task-config.js";

/**
 * @description Methods encapsulating discrete database operations; ensures
 * running tasks do not have access the entire databse API surface
 * @param {object} options
 * @param {object} options.dbClient
 * @param {object} options.logger
 */
export const TaskCapability = ({ dbClient, logger }) => {
  
  /**
   * @description APIs scoped to specified tasks
   */
  const capabilityAPIs = {
    "tasks.wines.bulk_import": {
      /**
       * 
       * @param {object[]} wineList 
       * @returns {Result<object[] | Error>}
       */
      async bulkImportWines(wineList) {
        try {
          const { data, error } = await dbClient.from('wines').insert(wineList).select();
          if (error) {
            return Result.error(error.message);
          }

          return data.length ? Result.ok(data) : Result.ok([]);
        } catch(ex) {
          logger.error(`INTERNAL ERROR (): **EXCEPTION ENCOUNTERED** while doing bulk import. Task will be *STOPPED* See details -> ${ex.message}`);
          return Result.error(ex.message);
        }
      }
    }
  }
  return {
    /**
     * @param {string} taskIdentifier - name of a defined task
     * @returns {object} a set of task-scoped API methods
     */
    of(taskIdentifier) {
      const api = capabilityAPIs[taskIdentifier];
      const allowedAPIs = taskConfig[taskIdentifier] || [];

      if (!api) {
        throw new Error(`INTERNAL ERROR: No capability API defined for task: ${taskIdentifier}`);
      }

      return Object.freeze(new Proxy(api, {
        get(target, prop) {

          if (!(allowedAPIs.includes(prop))) {
            throw new Error(
              `INTERNAL ERROR Task (${taskIdentifier}): Access to API "${prop}" DENIED for this task. Ensure permission is granted for this API. See ./task-config.js `
            );
          }

          if (!(prop in target)) {
            throw new Error(
              `INTERNAL ERROR Task (${taskIdentifier}): Property (${String(prop)}) is not defined`
            );
          }

          return  target[prop];
        }
      }));
    }
  }
};