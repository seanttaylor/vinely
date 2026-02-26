import { Sandbox } from "@honeycomb/core";

/**
 * This is the main entry point for the application.
 */
(async function() {
	try {
		await Sandbox.modules.autoLoad();

		const app = new Sandbox(['NOOPService'], async (hc) => {
			console.log('vinely v0.0.1');
			console.log(hc.my.NOOPService.hello('Leia Organa', 'Luke Skywalker'));
		});
		
	} catch(ex) {
		console.error(`INTERNAL ERROR (main): **EXCEPTION ENCOUNTERED** during application startup. See details -> ${ex.message}`);
	}
}());