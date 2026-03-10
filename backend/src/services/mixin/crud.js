import { Problem } from "../../types/problem.js";
import { Result } from "../../types/result.js";

/**
 * Mixin interface for typical CRUD capabilities; used to add CRUD to application services.
 * @note Mixins **must** be defined as functions returning object methods. Defining a Mixin as a class will cause any lookups on mixed-in methods to **FAIL**
 * @param {object} options
 * @param {object} options.dbClient - an instance of a database client
 * @param {object} options.logger - the logger interface
 * @param {object} options.sqlMap - a mapping of application services to SQL tables
 */
export const CrudMixin = ({ dbClient, logger, sqlMap }) => ({
  /**
   * @param {object} data
   */
  create(data) {
    throw new Error("Not implemented");
  },

  /**
   *
   * @param {*} id
   */
  updateById(id) {
    throw new Error("Not Implemented");
  },

  /**
   *
   */
  findOneById(id) {
    throw new Error("Not Implemented");
  },

  /**
   * @returns {Result<object[] | Error>}
   */
  async find() {
    const { data, error } = await dbClient
      .from(`${sqlMap[this.constructor.name]}`)
      .select("*");

    if (error) {
      logger.error(`INTERNAL ERROR (CrudMixin): The database returned an error while fetching records. See details -> ${error.message}` );
      return Result.error(Problem.of({
        title: "INTERNAL ERROR",
        detail: "There was an error fetching the requested resource."
      }));
    }

    return Result.ok(!data ? [] : data);
  },

  /**
   *
   */
  deleteById(id) {
    throw new Error("Not Implemented");
  },

  /**
   *
   * @param {*} id
   */
  exists(id) {
    throw new Error("Not Implemented");
  },
});
