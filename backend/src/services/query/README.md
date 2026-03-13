## Query Service

#### Gist

The Query Service orchestrates the vinely search pipeline by translating natural-language user queries into structured SQL queries and executing them through a configurable search strategy.

### Summary

The Query Service is an application-level service responsible for coordinating the end-to-end execution of search queries within the system. 

At startup, it loads the search vocabulary from the database and builds an in-memory lookup structure that maps keywords and phrases to SQL query fragments. When a client submits a search query, the service delegates the processing of that query to a configured `SearchStrategy`, providing the strategy with the vocabulary and a controlled database query runner. 

The strategy interprets the query string, constructs a SQL query using the vocabulary mappings, and executes it through the service’s query runner. Database queries are executed via stored SQL functions to ensure consistency and encapsulation of database logic. 

Throughout the process, the service manages readiness state, error handling, and runtime exception telemetry, ensuring that failures are captured and surfaced in a predictable format.

## Table of Contents 

- [Search Strategies](#search-strategies)
  - [Secondary Concepts](#search-strategies-secondary-concepts)
- [Search Vocabulary](#search-vocabulary)
  - [Secondary Concepts](#search-vocabulary-secondary-concepts)
- [Query Preparation and Execution](#query-preparation-and-execution)


### Search Strategies<a name="search-strategies"></a>

>_Search Strategies define how a user’s natural-language query is interpreted and transformed into a SQL query within the vinely search pipeline._

#### Summary

Search Strategies encapsulate the logic responsible for converting a raw search query into an executable database query. Each strategy implements a consistent interface that allows the `QueryService` to delegate query interpretation without needing to understand the details of how the query is processed. 

Strategies receive the search vocabulary from the service and use it to map user input to SQL query fragments through a series of deterministic transformations. These transformations form a query pipeline that normalizes the input, tokenizes it, identifies supported keywords and phrases, expands SQL templates, and assembles the final SQL query. 

Because strategies are interchangeable, the system can support different search behaviors—such as exploratory product discovery or direct product lookup—without altering the service responsible for executing queries. This separation of responsibilities keeps the query orchestration logic in the `QueryService` while allowing the interpretation and construction of SQL queries to evolve independently within individual strategies.

### Search Strategies | Secondary Concepts and Sub-Components <a name="search-strategies-secondary-concepts"></a>

#### Normalization

Normalization prepares the raw query string for processing by converting it to lowercase and removing punctuation. This ensures that variations in casing or punctuation do not affect keyword or phrase matching. The result is a standardized string suitable for deterministic parsing.

#### Tokenization

Tokenization splits the normalized query string into individual word tokens that can be evaluated against the search vocabulary. During this step, simple morphological adjustments such as naive plural removal are applied to improve matching consistency. The resulting token list becomes the input for phrase and keyword extraction.

#### Phrase and Keyword Extraction

Phrase and keyword extraction maps tokens from the user query to known vocabulary entries that correspond to SQL query fragments. The extractor attempts the longest possible phrase match first, consuming tokens when a phrase is found to prevent overlapping matches. If no phrase match is found, the system checks for a single-token keyword match before moving to the next token.

#### Alias Expansion

Alias expansion converts SQL template placeholders into valid table aliases used in the final query. Conditions containing alias placeholders are rewritten using the configured alias map. If a fragment requires a join, the corresponding JOIN clause template is retrieved from the join registry and expanded using the same alias mapping.

#### SQL Query Planning

SQL query planning organizes the extracted fragments into a structured representation of query components. SQL conditions are collected into a list while required JOIN clauses are deduplicated using a set to prevent redundant joins. The result is a plan consisting of the joins and conditions needed to build the final SQL query.

#### SQL Query Construction

SQL query construction converts the planned query components into a complete SQL statement. The query builder assembles the base `SELECT` statement, appends any required JOIN clauses, and conditionally adds a `WHERE` clause if search conditions are present. The resulting SQL string is passed to the query execution layer for retrieval of results.

### Search Vocabulary <a name="search-vocabulary"></a>

>_Search Vocabulary is the database-driven mapping layer that translates supported natural-language search terms and phrases into SQL query fragments used by the search pipeline._

#### Summary

The Search Vocabulary defines the set of natural-language inputs that the system can interpret and translate into structured database queries. 

Rather than hardcoding search behavior in application logic, supported search terms and phrases are stored in database tables where they map to SQL condition fragments and optional join requirements. 

During query processing, the search pipeline references this vocabulary to determine which parts of a user's query correspond to meaningful filters in the data model. This approach allows search capabilities to evolve by modifying database records rather than application code, enabling faster iteration and easier expansion of supported queries. 

The vocabulary supports both single-word keywords and multi-word phrases, allowing more precise interpretations of user intent. 

Because SQL fragments are stored alongside their join requirements, the system can dynamically assemble valid SQL queries without embedding schema-specific logic throughout the application layer.

### Search Vocabulary | Secondary Concepts and Sub-Components <a name="search-vocabulary-secondary-concepts"></a>

#### Keywords (Terms)

Keywords are single-token vocabulary entries that map individual search terms to SQL condition fragments. They represent the most granular level of supported search input and are evaluated only when no longer phrase match is found at a given token position. Keywords typically correspond to simple attribute filters such as categories, descriptors, or classifications within the data model.

#### Phrases (Multi-Token Terms)

Phrases are multi-token vocabulary entries that map specific word combinations to SQL query fragments. During query parsing, the extractor attempts to match the longest supported phrase first to capture more precise semantic meaning before falling back to single-token keyword matches. When a phrase match occurs, all tokens in the phrase are consumed to prevent overlapping or redundant matches.

#### Join Requirements

Join requirements (indicated by the `join_required` database column) specify when an SQL fragment depends on data from an additional table beyond the base query table. Instead of embedding raw SQL joins directly within vocabulary entries, each fragment references a join key that maps to a JOIN template stored in the join registry. During query assembly, the pipeline resolves these keys and attaches the necessary JOIN clauses while deduplicating them to ensure each join appears only once in the final SQL statement.


### Query Preparation and Execution<a name="query-preparation-and-execution"></a>

 >_Interpreted search inputs are transformed into executable database operations, from structured query fragments through vocabulary initialization to the final query execution boundary._

#### Summary

Once search input has been interpreted by a strategy, the system moves into a preparation and execution phase where SQL components are assembled and executed against the datastore. 

Query fragments act as the intermediate representation of SQL logic, allowing conditions and join dependencies to be composed dynamically during query planning. 

At application startup, the system performs vocabulary bootstrapping by loading the search vocabulary from the database and constructing the in-memory maps used during query parsing and fragment extraction. 

When a query has been fully constructed, strategies do not execute SQL directly; instead they pass the query to a `queryRunner` abstraction that defines the execution boundary between query planning and data access. This separation allows strategies to remain agnostic about the underlying datastore or execution mechanism. In the current architecture, the execution layer ultimately invokes database RPC functions that perform the search query within the database environment.

## Search Strategies In-Depth

> _Search Strategy Types define the different query interpretation approaches supported by the search system, allowing the service to handle distinct search intents using specialized query logic_.

### Summary

The search system supports multiple strategy types to accommodate different ways users search for wines. Some queries describe characteristics of a product—such as grape variety, flavor profile, or region—while others attempt to locate a specific wine by name. 

Rather than forcing both intents through a single interpretation pipeline, the system defines separate strategies that encapsulate the logic required for each search style. Each strategy implements the same interface but applies a different method of transforming user input into a query against the datastore. 

This separation allows the system to support both exploratory product discovery and direct product lookup while keeping the query logic for each approach focused and maintainable.

#### ProductDiscoveryStrategy 
This strategy handles **exploratory, attribute-based searches** where the user is describing characteristics of a wine rather than naming a specific product.

Examples:

* “dry red wine”
* “cabernet with blackberry”
* “italian white wine”

Mechanically it:

1. Processes the natural language query through the **query pipeline**
   (normalize → tokenize → extract keywords/phrases → expand aliases → plan SQL → build SQL).

2. Uses the **search vocabulary** to translate tokens and phrases into **SQL fragments**.

3. Dynamically builds a **filter-based SQL query** against the wine dataset.

4. Executes the resulting SQL via the **queryRunner abstraction**.

So **ProductDiscoveryStrategy = attribute filtering and discovery**.


#### ProductLookupStrategy

This strategy is intended for **direct product identification** rather than attribute filtering.

Examples:

* “Caymus Cabernet”
* “La Crema Pinot Noir”
* “Duckhorn Merlot”

Instead of interpreting descriptors like *dry* or *blackberry*, the strategy will:

1. Attempt to **identify a specific wine by name**.
2. Likely use **full-text search, trigram similarity, or a search RPC** on product names.
3. Return **direct matches to known products**, not a dynamically constructed attribute query.

So **ProductLookupStrategy = name-based product search**.

---

### Conceptual Difference

| Strategy                 | Query Intent                            | Data Interpretation                  | Query Construction                  |
| ------------------------ | --------------------------------------- | ------------------------------------ | ----------------------------------- |
| ProductDiscoveryStrategy | “Find wines with these characteristics” | Vocabulary-driven attribute matching | Dynamically assembled SQL fragments |
| ProductLookupStrategy    | “Find this specific wine”               | Name or brand matching               | Direct product search query         |

---

#### Architectural Rationale

Separating these strategies prevents two different search intents from interfering with each other:

* **Discovery queries** need vocabulary interpretation and SQL fragment composition.
* **Lookup queries** need **string matching against product names**.

>Trying to run both through the same pipeline would produce worse results.


