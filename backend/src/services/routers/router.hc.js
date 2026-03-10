import { ApplicationService } from "../../../system.js";
import { ProducerRouter } from "./producer.js";
import { QueryRouter } from "./query.js";
import { StatusRouter } from "./status.js";

import { WineRouter } from "./wine.js";

/**
 * @typedef {Object} DependentServices
 */

export default class RouteService extends ApplicationService {
  static service = "RouteService";
  
  #sandbox;
  
  /**
   * @param {ISandbox & {my: DependentServices}} sandbox
   */
  constructor(sandbox) {
    super();
    this.#sandbox = sandbox;
    // this.#sandbox.my.MiddlewareProvider;

    // const dataAccessLayer = this.#sandbox.my.DataAccessLayer;
    const Events = this.#sandbox.my.Events;
    const MiddlewareProvider = this.#sandbox.my.MiddlewareProvider;

    const ProducerService = this.#sandbox.my.ProducerService;
    const QueryService = this.#sandbox.my.QueryService;
    const WineService = this.#sandbox.my.WineService;
    // const config = this.#sandbox.my.Config;
    // const cache = this.#sandbox.my.Cache;
    const logger = this.#sandbox.core.logger.getLoggerInstance();

    this.Producer = new ProducerRouter({ Events, MiddlewareProvider, ProducerService });
    this.Query = new QueryRouter({ Events, MiddlewareProvider, QueryService });
    this.Status = new StatusRouter(/*this.#sandbox.my.MiddlewareProvider*/);
    this.Wine = new WineRouter({ Events, MiddlewareProvider, WineService });
    //this.Events = new EventsRouter({ MiddlewareProvider, events, logger });
  }
}
