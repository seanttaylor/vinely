/**
 * @readonly
 * @enum {string}
 */
export const Events = Object.freeze({
    SEARCH_MODE_CHANGED: 'ionChange',
    SEARCH_QUERY: 'ionInput',
});

(async function (window) {
    console.log('vine.ly.fe v0.0.1');
    const $ = document.querySelector.bind(document);

    const ionSegment = $('ion-segment');
    const ionSearchbar = $('ion-searchbar');


    /******** NON_SECRET CONFIGURATION *******/
    const config = {
        vars: {
            BACKEND_URI: `https://crispy-goggles-x79jw9xwg42vr64-8080.app.github.dev`,
            DEFAULT_SEARCH_MODE: 'product_lookup',
        }
    };

       /******** CORE APPLICATION STATE *******/
    const app = {
        searchMode: config.vars.DEFAULT_SEARCH_MODE
    }

    /******** EVENT REGISTRATION *******/
    ionSegment.addEventListener(Events.SEARCH_MODE_CHANGED, onChangeSearchMode);
    ionSearchbar.addEventListener(Events.SEARCH_QUERY, onSearch);

    /**
     * @param {object} event
     * @param {object} event.detail 
     */
    function onChangeSearchMode({ detail }) {
        console.log(detail);
    }

    /**
    * @param {object} event
    * @param {object} event.detail 
    */
    async function onSearch({ detail }) {
        const url = new URL(`/search?q=${detail.value}&qtype=${app.searchMode}`, config.vars.BACKEND_URI);
        console.log(url.href);
        // push search query to backend
        await window.fetch(url, {
            method: 'POST'
        })
    }

}(window));