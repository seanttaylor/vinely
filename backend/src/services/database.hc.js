import { createClient } from "@supabase/supabase-js";
import { ISandbox } from "../interfaces.js";
import { ApplicationService } from "../../system.js";


/**
 *
 */
export default class Database extends ApplicationService {
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

      const { SUPABASE_URL, SUPABASE_KEY } = sandbox.my.Config.keys;

      this.#dbClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (ex) {
      this.#logger.log(
        `INTERNAL_ERROR (Database): **EXCEPTION ENCOUNTERED** during initialization. See details -> ${ex.message}`
      );
    }
  }

  /**
   * Gets an instance of the Supabase client
   * @returns {Object}
   */
  getClient() {
    return this.#dbClient;
  }
}
