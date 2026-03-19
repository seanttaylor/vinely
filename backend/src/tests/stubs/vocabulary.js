/**
 * @description Stubbed vocabulary for unit testing; includes a supported
 * search keyword record from the database; used for testing the
 * `QueryService.#loadVocabulary` and `.#buildVocabulary` methods
 */
export const keywords = [
  {
    created_at: "2026-03-11 14:59:55.614619+00",
    term: "zesty",
    definition: "Zesty high acid wine",
    attribute: "acidity",
    operator: ">=",
    value: "4",
    id: "e163231e-d4b0-4fba-a3b9-082df04df4e6",
  },
  {
    created_at: "2026-03-04 16:50:54.96017+00",
    term: "white",
    definition: "white wine",
    attribute: "color",
    operator: "=",
    value: "white",
    id: "a0446102-8e32-4b6d-a562-e4b350e61e34",
  },
  {
    created_at: "2026-03-03 16:26:27.066066+00",
    term: "minerally",
    definition: "noticeable mineral character",
    attribute: "minerality",
    operator: ">=",
    value: "3",
    id: "7cabbfd8-96d0-48f0-bb13-644867d70184",
  },
  {
    created_at: "2026-03-04 16:50:54.96017+00",
    term: "cheap",
    definition: "budget wine",
    attribute: "price",
    operator: "<=",
    value: "2",
    id: "423c0df1-9781-4a9e-82c7-a224b9a86c57",
  },
];

/**
 * @description Stubbed vocabulary for unit testing; includes a supported
 * search phrase record from the database; used for testing the
 * `QueryService.#loadVocabulary` and `.#buildVocabulary` methods
 */
export const phrases = [
  {
    id: "725cbb01-ae2d-4561-8664-242be75f3a1f",
    created_at: "2026-03-04 17:02:49.561588+00",
    phrase: "tropical white",
    condition: "color = 'white' AND flavor ILIKE '%tropical%'",
    definition: "tropical white",
    join_required: null,
  },
];

/**
 * @description Stubbed vocabulary for unit testing; includes supported
 * **MAPPED** search keywords (i.e. keywords that have been pulled from the database 
 * and run through the `QueryService.#buildVocabulary` method); used for testing the
 * query parsing and SQL building logic
 */
export const mappedVocabularyKeywords = {
  cheap: {
    condition: "price <= 2",
    join: null,
  },
  white: {
    condition: "color = 'white'",
    join: null,
  },
  minerally: {
    condition: "minerality >= 3",
    join: null,
  },
};

/**
 * @description Stubbed vocabulary for unit testing; includes supported
 * **MAPPED** search phrases (i.e. phrases that have been pulled from the database 
 * and run through the `QueryService.#buildVocabulary` method); used for testing the
 * query parsing and SQL building logic
 */
export const mappedVocabularyPhrases = {
  1: {
    pinotage: {
      condition:
        "{alias.wine_grapes}.grape_id = '6762e998-598c-412f-91c5-99d0c2618562'",
      joinKey: "wine_grapes",
    },
  },
};