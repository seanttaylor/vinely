import { Sandbox } from "@honeycomb/core";
import { Events } from "./src/types/system-event.js";
import { policies } from "./policies.js";

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
        "NOOPService",
        "QueryService",
        "RouteService",
      ],
      async (hc) => {
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
          const { data, error } = await client.schema("telemetry")
            .from("runtime_exceptions")
            .insert({
              id: event.header.id,
              message: event.payload.message,
              service: event.payload.service,
              stack: event.payload.stack,
            });
          
          if (error) {
            console.error(`INTERNAL ERROR (main): **EXCEPTION ENCOUNTERED** while logging a runtime exception to the database. See details -> ${error.message}`);
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
