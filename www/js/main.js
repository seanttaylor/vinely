import { ObjectSubscription } from "./object-subscription.js";
import { QueryService } from "./services/query.js";
import { Result } from "./types/result.js";
import { safeFind } from "./utils.js";

import { UISearchResults } from "./ui-components/search-results.js";
import { UISegmentedControl } from "./ui-components/segmented-control.js";
import { UISegmentView } from "./ui-components/segment-view.js";

/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
    // Fires when a the `UISegmentedControl` changes state
    SEARCH_MODE_CHANGED: 'on_segment',
    // Fires when a search query is entered in the search input
    SEARCH_QUERY: 'input',
});

/**
 * Maps search modes to placeholder text for user hints on
 * *how* to search
 * @readonly
 * @enum {string}
 */
export const SearchbarPlacedholderText = Object.freeze({
    product_lookup: 'e.g. Tomaiolo Chianti Classico',
    product_discovery: 'e.g. cheap minerally whites',
});

/**
 * 
 * @param {object} window 
 * @param {object} event 
 */
async function loadApp(window, event = {}) {
    console.log('vine.ly.fe v0.0.1');

    try {
        const $ = (cssSelector) => {
            return () => {
                return document.querySelector(cssSelector);
            }
        }
        const defineCustomElement = (elementName, elementConstructor) => {
            if (customElements.get(elementName)) {
                return;
            }
            customElements.define(elementName, elementConstructor);
        };

        const url = Result.from(
            safeFind('/detail/state/url').on(event)
        ).getOrElse(window.location.href);
        const currentPath = new URL(url).pathname;

        /******** WEB COMPONENTS DEFINITION *******/
        defineCustomElement('ui-search-results', UISearchResults);
        defineCustomElement('ui-segmented-control', UISegmentedControl);
        defineCustomElement('ui-segment-view', UISegmentView);

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
                // NOOP that initializes the subscription API of `GLOBAL`
                // Subsequent subscribers don't need to assign a subscription to a variable
            },
            templateGlobal,
        );

        /******** UI EVENT REGISTRATION *******/
        setTimeout(() => {
            if (currentPath !== '/index-2.html') {
                return;
            }

            getIonSegment().addEventListener(Events.SEARCH_MODE_CHANGED, onChangeSearchMode);
            getIonSearchbar().addEventListener(Events.SEARCH_QUERY, onSearch);
        }, 0)

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            e.preventDefault();

            PUSH({
                url: link.getAttribute('href'),
                transition: link.dataset.transition
            });
        });


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
    } catch (ex) {
        console.error(`INTERNAL ERROR (App): ${ex.message}`);
    }
}

window.addEventListener('push', (e) => {
    loadApp(window, e);
});
loadApp(window);


