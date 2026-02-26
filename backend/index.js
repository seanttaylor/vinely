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
        "HTTPService",
        "Config",
        "RouteService",
        "NOOPService",
        "Events",
        "QueryService",
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
                `INTERNAL_ERROR (Main): Exception encountered during async event handler (${fn.name}) See details -> ${ex.message}`
              );
            }
          };
        }

        async function onTelemetryPush(event) {
					console.log(event);
				}
        console.log("vinely v0.0.1");
        console.log(hc.my.QueryService.search("test"));
      },
      policies
    );
  } catch (ex) {
    console.error(
      `INTERNAL ERROR (main): **EXCEPTION ENCOUNTERED** during application startup. See details -> ${ex.message}`
    );
  }
})();
