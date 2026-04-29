import { QueryService } from "./query.js";

/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
    //
    SEARCH_MODE_CHANGED: 'ionChange',
    //
    SEARCH_QUERY: 'ionInput',
});

(async function (window) {
    console.log('vine.ly.fe v0.0.1');
    const $ = document.querySelector.bind(document);
    
    /******** NON_SECRET CONFIGURATION *******/
    const config = {
        vars: {
            BACKEND_URI: `https://crispy-goggles-x79jw9xwg42vr64-8080.app.github.dev`,
            DEFAULT_SEARCH_MODE: 'product_lookup',
        }
    };
    
    const myQueryService = new QueryService(config);
    const ionSegment = $('ion-segment');
    const ionSearchbar = $('ion-searchbar');

    /******** CORE APPLICATION STATE *******/
    const global = {
        search: {
            mode: config.vars.DEFAULT_SEARCH_MODE,
            latestResults: null
        }
    }

    /******** EVENT REGISTRATION *******/
    ionSegment.addEventListener(Events.SEARCH_MODE_CHANGED, onChangeSearchMode);
    ionSearchbar.addEventListener(Events.SEARCH_QUERY, onSearch);

    /**
     * @param {object} event
     * @param {object} event.detail 
     */
    function onChangeSearchMode({ detail }) {
        const { value } = detail;
        global.searchMode = value;
        global.foo = true;
    }

    /**
    * @param {object} event
    * @param {object} event.detail 
    */
    async function onSearch({ detail }) {
        const { value: searchQuery } = detail;
        const queryResult = await myQueryService.runQuery(searchQuery, global.searchMode);
        global.search.latestResults = queryResult;

    }

}(window));