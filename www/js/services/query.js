import { Result } from "../types/result.js";

export class QueryService {
    #config;

    constructor(config) {
        this.#config = config;
    }

    /**
     * 
     * @param {string} query 
     * @param {string} mode
     * @returns {Result}
     */
    async runQuery(query, mode = 'product_lookup') {
        try {
            if (typeof mode !== 'string') {
                return Result.error(`runQuery **must** have 'mode' parameter of type (string); received type ${typeof mode}`);
            }

            const url = new URL(`/search?q=${query}&qtype=${mode}`, this.#config.vars.BACKEND_URI);
            const request = await window.fetch(url);
            const response = await request.json();

            if (request.status !== 200) {
                return Result.error(request.text);
            }

            return Result.from(response);
        } catch (ex) {
            console.error(`INTERNAL_ERROR (QueryService.FE): EXCEPTION ENCOUNTERED** while executing search query. See details -> ${ex.message}`);
            return Result.error();
        }
    }
}