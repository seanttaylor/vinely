import { ObjectSubscription } from "./object-subscription.js";
import { QueryService } from "./services/query.js";
import { UISearchResultList } from "./ui-components/search-results.js";

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

/**
 * @readonly
 * @enum {string}
 */
export const SearchbarPlacedholderText = Object.freeze({
    //
    product_lookup: 'e.g. Tomaiolo Chianti Classico',
    //
    product_discovery: 'e.g. cheap minerally whites',
});

(async function (window) {
    console.log('vine.ly.fe v0.0.1');
    const $ = document.querySelector.bind(document);

    customElements.define('ui-search-results', UISearchResultList());

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
    
    /******** CORE STARTING APPLICATION STATE *******/
    const templateGlobal = {
        search: {
            mode: config.vars.DEFAULT_SEARCH_MODE,
            latest: null
        }
    };

    /**
     * Callback for changes to the subscribed object.
     * @param {ChangeObject} change - The details of the change.
     */
    const GLOBAL = new ObjectSubscription(
        () => {
            // NOOP subscription that initializes the subscription API of `GLOBAL`
            // Subsequent subscribers don't need to assign a subscription to a variable
        },
        templateGlobal,
    );

    /******** UI EVENT REGISTRATION *******/
    ionSegment.addEventListener(Events.SEARCH_MODE_CHANGED, onChangeSearchMode);
    ionSearchbar.addEventListener(Events.SEARCH_QUERY, onSearch);


    /******** APPLICATION SUBSCRIPTIONS *********/
    new ObjectSubscription(
        (change) => {
            ionSearchbar.placeholder = SearchbarPlacedholderText[change.value.new];
        }, 
        templateGlobal,
        '/search/mode'
    );

     new ObjectSubscription(
        (change) => {
            $('ui-search-results').onComponentUpdate(change.value.new);
        }, 
        templateGlobal,
        '/search/latest'
    );

    /**
     * Responds to changes in the segmented button indicating the user's desired search mode
     * @param {object} event
     * @param {object} event.detail 
     */
    function onChangeSearchMode({ detail }) {
        const { value } = detail;
        GLOBAL.search.mode = value;
    }

    /**
     * Executes a user search after collecting the search query from the search bar 
     * @param {object} event
     * @param {object} event.detail 
    */
    async function onSearch({ detail }) {
        const { value: searchQuery } = detail;
        const queryResult = await myQueryService.runQuery(searchQuery, GLOBAL.search.mode);
        GLOBAL.search.latest = queryResult;
    }
}(window));