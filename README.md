## 1. Overview

This project implements a dynamic, vocabulary-driven search system for wines that translates natural-language queries into executable SQL. It enables users to search using everyday language (e.g. “cheap pinot noir” or “dry italian white”) and returns structured results from the database.

At its core, the system separates **query interpretation** from **query execution**, allowing search behavior to evolve through database-driven vocabulary updates and pluggable search strategies rather than hardcoded logic.

---

## 2. Key Concepts

* **Query Service**
  The central application service that orchestrates the search pipeline, manages vocabulary, and delegates query execution to strategies.

* **Search Strategies**
  Pluggable components that define how a query is interpreted (e.g. attribute-based discovery vs direct product lookup).

* **Search Vocabulary**
  A database-driven mapping of natural language (keywords and phrases) to SQL query fragments and join requirements.

* **Query Pipeline**
  A deterministic sequence of transformations that converts a raw query string into a structured SQL query.

---

## 3. How Search Works (High-Level Flow)

1. **User submits a query**
   Example: `"cheap pinot noir"`

2. **Strategy is selected**
   Determines how the query will be interpreted (e.g. product discovery).

3. **Query is processed through the pipeline**

   * Normalize input (lowercase, remove punctuation)
   * Tokenize into words
   * Extract matching keywords and phrases from the vocabulary
   * Expand SQL templates (aliases and joins)
   * Plan query structure (conditions + joins)
   * Build final SQL string

4. **SQL query is executed**

   * Passed to a database RPC function via the query execution boundary

5. **Results are returned**

   * Structured data returned to the application layer

---

## 4. Architecture

### 4.1 Application Layer

The application layer is centered around the **QueryService**, which orchestrates the search process end-to-end. It is responsible for loading the search vocabulary at startup, maintaining service readiness, and delegating query execution to the appropriate search strategy.

Search behavior is implemented using the **strategy pattern**, allowing different query interpretation approaches (e.g. product discovery vs product lookup) to share a common interface while encapsulating their own logic. This keeps the QueryService focused on orchestration rather than interpretation.

---

### 4.2 Data Layer

The data layer provides both the **search vocabulary** and the **execution environment** for queries.

* **Vocabulary Tables**

  * `vocabulary.terms` — stores keyword mappings (single-token inputs → SQL conditions)
  * `vocabulary.phrases` — stores phrase mappings (multi-token inputs → SQL conditions + optional join requirements)

* **RPC Functions**

  * Search queries are executed via database functions (e.g. `search_wines_product_discovery`)
  * These functions act as the controlled interface for executing dynamically generated SQL

This design allows search capabilities to be extended by updating database records rather than modifying application code.

---

### 4.3 Execution Boundary

The system enforces a strict separation between **query construction** and **query execution** through the `queryRunner` abstraction.

* Strategies generate SQL strings but do not execute them directly
* The QueryService provides `queryRunner` as the only mechanism for interacting with the database
* This abstraction ensures:

  * Strategies remain datastore-agnostic
  * Database access is centralized and controlled
  * Errors and telemetry are handled consistently

---

## 5. Example Queries

### Example 1: “cheap pinot noir”

**Input**

```
cheap pinot noir
```

**Extracted Fragments**

```
[
  { condition: "wines.price <= 20", joinKey: null },
  { condition: "{alias.wine_grapes}.grape_id = 'uuid'", joinKey: "wine_grapes" }
]
```

**Planned Query Components**

```
JOIN wine_grapes wg ON wg.wine_id = wines.id

WHERE wines.price <= 20
AND wg.grape_id = 'uuid'
```

**Final SQL**

```sql
SELECT wines.*
FROM wines
JOIN wine_grapes wg ON wg.wine_id = wines.id
WHERE wines.price <= 20
AND wg.grape_id = 'uuid';
```

---

### Example 2: “dry italian white”

**Input**

```
dry italian white
```

**Extracted Fragments**

```
[
  { condition: "wines.sweetness <= 2", joinKey: null },
  { condition: "wines.country = 'italy'", joinKey: null },
  { condition: "wines.color = 'white'", joinKey: null }
]
```

**Final SQL**

```sql
SELECT wines.*
FROM wines
WHERE wines.sweetness <= 2
AND wines.country = 'italy'
AND wines.color = 'white';
```

---

### Example 3: “minerally sauvignon blanc”

**Input**

```
minerally sauvignon blanc
```

**Extracted Fragments**

```
[
  { condition: "wines.minerality >= 7", joinKey: null },
  { condition: "{alias.wine_grapes}.grape_id = 'uuid'", joinKey: "wine_grapes" }
]
```

**Final SQL**

```sql
SELECT wines.*
FROM wines
JOIN wine_grapes wg ON wg.wine_id = wines.id
WHERE wines.minerality >= 7
AND wg.grape_id = 'uuid';
```

