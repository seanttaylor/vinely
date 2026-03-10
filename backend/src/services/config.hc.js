// import { ISandbox } from "../../interfaces.js";
import { ApplicationService } from "../../system.js";

/**
 * @description Maps service names to their corresponding SQL tables
 */
const SQL_TABLE_MAP = Object.freeze({
  WineService: "wines",
  ProducerService: "producers"
});

/**
 *
 */
export default class Config extends ApplicationService {
  static service = "Config";

  #sandbox;

  /**
   * @param {ISandbox}
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
  }

  /**
   * @returns {Object}
   */
  get featureFlags() {
    return {};
  }

  /**
   * @returns {Object}
   */
  get keys() {
    return {
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
    };
  }

  /**
   * @returns {Object}
   */
  get vars() {
    return {
      PORT: 8080,
      SQL_TABLE_MAP,
    };
  }
}
