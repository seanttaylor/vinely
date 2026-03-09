import { ApplicationService } from "../../../system.js";
import { CrudMixin } from "./crud.js";

/**
 * Houses various capabilities that can be mixed into existing application services.
 */
export default class MixinProvider extends ApplicationService {
  static service = "MixinProvider";

  #logger;
  #sandbox;

  /**
   * @param {ISandbox} sandbox
   */
  constructor(sandbox) {
    super();

    this.#sandbox = sandbox;
    this.#logger = sandbox.core.logger.getLoggerInstance();
  }

  Crud = CrudMixin;
}
