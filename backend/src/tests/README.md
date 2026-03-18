# Vinely Unit Test Suit

## Overview

This test suite validates the behavior of application services using a composable, dependency-injected testing architecture. The goal is to test services in isolation while preserving realistic execution flows (e.g., async initialization, middleware chaining, and strategy execution).

At the center of this approach are:

* **Service Harnesses** – controlled environments for instantiating services
* **Mixins** – composable dependency overrides (fakes, mocks, events, etc.)
* **Test Doubles** – structured replacements for real components

---

## Core Concepts

### Service Harness

The **Service Harness** is responsible for instantiating a service with controlled dependencies.

```js
const { service } = getServiceHarness(ServiceClass, overrides);
```

It allows tests to:

* Inject fake or mocked dependencies
* Control side effects (e.g., database, logging, middleware)
* Simulate failure modes during initialization
* Keep tests deterministic and isolated

#### Key Responsibilities

* Dependency injection via mixins
* Service lifecycle control (including async readiness)
* Providing a consistent interface for tests

---

### Mixins

Mixins are plain objects that override or extend parts of the service dependency graph.

They are composed using object spread:

```js
const overrides = {
  ...mixinFakeSupabaseClient,
  ...mixinFakeMiddleware,
  ...mixinEvents,
  core: { ...mixinFakeLogger },
};
```

#### Why Mixins?

* Avoid rigid test setup
* Enable fine-grained control over dependencies
* Support composability across tests
* Keep tests declarative

#### Common Categories

##### Fake Mixins

Provide working implementations with controlled behavior.

Examples:

* `mixinFakeSupabaseClient`
* `mixinFakeLogger`
* `mixinFakeMiddleware`

Used to:

* Simulate successful flows
* Return predictable data

---

##### Broken / Failure Mixins

Simulate failure modes.

Examples:

* `mixinFakeBrokenSupabaseClient`
* `mixinFakeBrokenSupabaseClientRPCOnlyThrows`
* `mixinFakeSupabaseClientReturnsVocabularyPhraseErrors`

Used to:

* Test error handling
* Validate resilience and logging behavior

---

##### Event Mixins

Provide event-driven behavior for services that depend on pub/sub or lifecycle hooks.

Example:

* `mixinEvents`

---

### Test Doubles

This suite uses several types of test doubles:

| Type | Purpose                                      |
| ---- | -------------------------------------------- |
| Fake | Working implementation with simplified logic |
| Mock | Pre-programmed behavior with expectations    |
| Spy  | Observes interactions (calls, arguments)     |

---

### Spies

Spies are used to observe how functions are called during execution.

Example:

```js
const spy = createSpy();

const mockStrategy = createMockSearchStrategy(
  spy.onSearchStrategyRun
);
```

#### What Spies Track

* Call count
* Arguments passed
* Execution flow through strategies

#### Typical Assertions

```js
assert.equal(spy.callCount, 1);
assert.equal(typeof spy.calls.args.queryString, "string");
assert.equal(typeof spy.calls.args.queryRunner, "function");
```

---

### Search Strategy Testing

Search behavior is abstracted via **strategies**, which are injected into the service.

```js
service.setStrategy(mockStrategy);
```

#### What Gets Tested

* Strategy receives vocabulary
* Strategy execution success/failure
* Exception handling within strategies
* Proper wrapping in `Result` types

---

### Async Initialization

Some services perform async work during construction (e.g., loading vocabulary).

Tests must account for this:

```js
await TestingTools.Time.delay(DEFAULT_TIMEOUT_MILLIS);
```

#### Why This Matters

* Service readiness (`service.ready`) depends on async work
* Tests must wait before asserting state or behavior

---

### Result & Problem Types

Service methods return structured results:

* `Result` → success or error wrapper
* `Problem` → standardized error representation

#### Example Assertions

```js
assert.ok(result.isError());
assert.equal(result.getError().title, "SERVICE UNAVAILABLE");
```

---

## Test Structure

Tests are organized into logical groups:

### 1. Service Startup

Validates:

* Instantiation
* Dependency failures
* Initialization behavior
* Readiness state

---

### 2. Search Strategies

Validates:

* Strategy injection
* Vocabulary propagation
* Strategy error handling

---

### 3. Query Execution

Validates:

* Query runner integration
* Error handling (throws vs returns errors)
* Successful data retrieval
* Spy-based verification of execution

---

## Naming Conventions

Consistency in naming helps communicate intent clearly.

### Mixins

* `mixinFake*` → working fake implementations
* `mixinFakeBroken*` → failure scenarios
* `mixinEvents` → event system behavior

---

### Test Cases

Use descriptive, behavior-driven naming:

```js
it("Should FAIL when the query runner encounters an exception", ...)
```

Pattern:

> **Should [EXPECTED OUTCOME] when [CONDITION]**

---

## Design Philosophy

This test suite favors:

* **Composition over configuration**
* **Explicit dependency control**
* **Behavior-driven validation**
* **Minimal hidden magic**

The goal is not just correctness, but **clarity of system behavior under varying conditions**.

