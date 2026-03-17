/**
 * Stubbed vocabulary for unit testing; includes a supported
 * search keyword record from the database
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
];

/**
 * @description Stubbed vocabulary for unit testing; includes a supported 
 * search phrase record from the database
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
