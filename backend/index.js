import { Sandbox } from "@honeycomb/core";
import { Events } from "./src/types/system-event.js";
import { policies } from "./policies.js";

const Mixin = {
  /**
   * Creates a mixin from a given interface
   * @param {object} mixinInterface - a function definining a Mixin
   */
  of(mixinInterface) {
    return {
      /**
       * 
       * @param {object} options - optional local dependencies for use in the mixin
       */
      include(options = {}) {
        /**
         * Applies the mixin to application service instance
         * @param {object} target - an application service instance; this function **MUST** be called to use the mixin
         */
        return function (target) {
          Object.assign(target, mixinInterface(options));
        };
      },
    };
  },
};

/**
 * This is the main entry point for the application.
 */
(async function () {
  try {
    await Sandbox.modules.autoLoad();

    const app = new Sandbox(
      [
        "Config",
        "Database",
        "Events",
        "HTTPService",
        "MiddlewareProvider",
        "MixinProvider",
        "NOOPService",
        "ProducerService",
        "QueryService",
        "RouteService",
        "TaskService",
        "WineService"
      ],
      async (hc) => {
        const logger = hc.core.logger.getLoggerInstance();
        const dbClient = hc.my.Database.getClient();
        const config = hc.my.Config;

        const mixinCrudWith = Mixin.of(hc.my.MixinProvider.Crud).include({
          dbClient,
          logger,
          sqlMap: config.vars.SQL_TABLE_MAP,
        });
        
        /******** SERVICE MIXINS ********/
        mixinCrudWith(hc.my.WineService);
        mixinCrudWith(hc.my.ProducerService);
        
        /******** EVENT REGISTRATION ********/
        hc.my.Events.addEventListener(
          Events.RUNTIME_EXCEPTION,
          wrapAsyncEventHandler(onTelemetryPush)
        );

        /**
         * Wraps async functions used as handlers for an
         * `EventTarget` instance; ensures any thrown exceptions are
         * caught by the main application
         * @param {Function} fn
         * @returns {Function}
         */
        function wrapAsyncEventHandler(fn) {
          return async function ({ detail: event }) {
            try {
              await fn(event);
            } catch (ex) {
              console.error(
                `INTERNAL_ERROR (main): **EXCEPTION ENCOUNTERED** during async event handler (${fn.name}) See details -> ${ex.message}`
              );
            }
          };
        }

        async function onTelemetryPush(event) {
          console.log(event);
          const client = hc.my.Database.getClient();
          const { data, error } = await client
            .schema("telemetry")
            .from("runtime_exceptions")
            .insert({
              id: event.header.id,
              message: event.payload.message,
              service: event.payload.service,
              stack: event.payload.stack,
            });

          if (error) {
            console.error(
              `INTERNAL ERROR (main): **EXCEPTION ENCOUNTERED** while logging a runtime exception to the database. See details -> ${error.message}`
            );
          }
        }

        console.log("vinely v0.0.1");
        //console.log(hc.my.QueryService.search("test"));
      },
      policies
    );
  } catch (ex) {
    console.error(
      `INTERNAL ERROR (main): **EXCEPTION ENCOUNTERED** during application startup. See details -> ${ex.message}`
    );
  }
})();
