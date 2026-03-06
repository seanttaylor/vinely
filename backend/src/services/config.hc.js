// import { ISandbox } from "../../interfaces.js";
import { ApplicationService } from "../../system.js";

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
    };
  }
}
