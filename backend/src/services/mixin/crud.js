/**
 * Mixin interface for typical CRUD capabilities; used to add CRUD to application services.
 * @note Mixins **must** be defined as functions returning object methods. Defining a Mixin as a class will cause any lookups on mixed-in methods to **FAIL**
 */
export const CrudMixin = ()=> ({

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
   *
   */
  find() {
    throw new Error("Not Implemented");
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
  }
}) 
