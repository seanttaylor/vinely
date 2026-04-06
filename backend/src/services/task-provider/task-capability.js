import { Result } from "../../types/result.js";
import { taskConfig } from "./task-config.js";

const stubWines = [
  {
    id: "4a476e11-9dc0-43c1-a557-fd9a0db31480",
    created_at: "2026-04-06T16:56:54.344591+00:00",
    name: "Marques De Borba",
    color: "white",
    sparkling: true,
    minerality: 3,
    description: "The 2022/2023 vintage was marked by a warm winter, dry spring, and hot summer, contributing to an early and balanced grape maturation. The result is a fresh, aromatic, and well-structured white wine, embodying the unique conditions of Alentejo.",
    acidity: 1,
    body: "light",
    tags: null,
    vintage: "2024",
    tasting_notes: "Fresh citrus fruits like grapefruit and lemon, with subtle oak toast that complements rather than dominates the fruit. Vibrant freshness and mineral tension, with a smooth texture from extended lees aging. Balanced, elegant, and lingering finish.",
    producer_id: "ed8a1daa-c669-40ed-a1df-8d1934cc7f9c",
    price: 2,
    sweetness: 1,
    kosher: true,
    name_tsv: "'borba':3 'de':2 'marqu':1",
    grapes: "Arinto,Barbera"
  },
  {
    id: "3843cd28-10a9-491d-af47-4a202b541d99",
    created_at: "2026-04-06T16:56:54.344591+00:00",
    name: "Du Toitskloof - Pinotage",
    color: "red",
    sparkling: true,
    minerality: 1,
    description: "Plum and oak with hints of banana.",
    acidity: 1,
    body: "full",
    tags: null,
    vintage: "2023",
    tasting_notes: "Notes of banana, plum and cigar. A very drinkable wine at a very affordable price. Compares well with more expensive Pinos.",
    producer_id: "ec12094b-08e0-464d-a444-6d32cc09a4bb",
    price: 2,
    sweetness: 1,
    kosher: true,
    name_tsv: "'du':1 'pinotag':3 'toitskloof':2",
    grapes: "Carignan,Baga"
  },
];

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

          return Result.ok(stubWines);
          return data.length ? Result.ok(data) : Result.ok([]);
        } catch(ex) {
          logger.error(`INTERNAL ERROR (TaskCapability): **EXCEPTION ENCOUNTERED** while doing bulk import. Task will be *STOPPED* See details -> ${ex.message}`);
          return Result.error(ex.message);
        }
      },
    },
    "tasks.wines.map_wine_grapes": {
      /**
       * 
       * @returns {Result<object[] | Error>}
       */
      async getAllGrapes() {
        try {
          const { data, error } = await dbClient.from('grapes').select();
          if (error) {
            return Result.error(error.message);
          }

          return data.length ? Result.ok(data) : Result.ok([]);
        } catch(ex) {
          logger.error(`INTERNAL ERROR (TaskCapability): **EXCEPTION ENCOUNTERED** while fetching grapes. Task will be *STOPPED* See details -> ${ex.message}`);
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
        throw new Error(`INTERNAL ERROR Task (${taskIdentifier}): No capability API defined for task: ${taskIdentifier}`);
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