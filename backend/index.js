import { Sandbox } from "@honeycomb/core";
import { policies } from "./policies.js";

/**
 * This is the main entry point for the application.
 */
(async function() {
	try {
		await Sandbox.modules.autoLoad();

		const app = new Sandbox(['HTTPService', 'Config', 'RouteService'], async (hc) => {
			console.log('vinely v0.0.1');
			//console.log(hc.my.NOOPService.hello('Leia Organa', 'Luke Skywalker'));
		}, policies);
		
	} catch(ex) {
		console.error(`INTERNAL ERROR (main): **EXCEPTION ENCOUNTERED** during application startup. See details -> ${ex.message}`);
	}
}());