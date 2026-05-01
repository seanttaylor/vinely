import { ObjectSubscription } from "./object-subscription.js";
import { QueryService } from "./services/query.js";
import { UISearchResultList } from "./ui-components/search-results.js";

/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
    //
    SEARCH_MODE_CHANGED: 'mode_changed',
    //
    SEARCH_QUERY: 'input',
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
    const $ = (cssSelector) => {
        return () => {
            return document.querySelector(cssSelector);
        }
    }

    //customElements.define('ui-search-results', UISearchResultList());

    /******** NON_SECRET CONFIGURATION *******/
    const config = {
        vars: {
            BACKEND_URI: `https://crispy-goggles-x79jw9xwg42vr64-8080.app.github.dev`,
            DEFAULT_SEARCH_MODE: 'product_lookup',
        }
    };

    const myQueryService = new QueryService(config);
    const getIonSegment = $('[data-component=search-mode-selector]');
    const getIonSearchbar = $('input[type=search]');
    const getSearchResultsList = $('ui-search-results');
    
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
    setTimeout(() => {
        getIonSegment().addEventListener(Events.SEARCH_MODE_CHANGED, onChangeSearchMode);
        getIonSearchbar().addEventListener(Events.SEARCH_QUERY, onSearch);
    }, 0)


    /******** APPLICATION SUBSCRIPTIONS *********/
    new ObjectSubscription(
        (change) => {
            getIonSearchbar().placeholder = SearchbarPlacedholderText[change.value.new];
        }, 
        templateGlobal,
        '/search/mode'
    );

     new ObjectSubscription(
        (change) => {
            getSearchResultsList().onComponentUpdate(change.value.new);
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
     * @param {object} event 
    */
    async function onSearch(event) {
        const searchQuery = event.target.value;
        const queryResult = await myQueryService.runQuery(searchQuery, GLOBAL.search.mode);
        GLOBAL.search.latest = queryResult;
    }
}(window));