## Task Service

#### Gist

The Task Service orchestrates the execution of asynchronous work by constructing, sequencing, and managing tasks as composable workflows.

---

### Summary

The Task Service is an application-level orchestration layer responsible for managing the lifecycle and composition of asynchronous tasks within the system.

At its core, the service acts as both a **factory** and a **registry**, creating `Task` instances from either user-provided functions or predefined task implementations exposed through the `TaskProvider`. Each created task is stored in an in-memory registry, allowing the system to track execution state, retrieve task metadata, and inspect progress over time.

When multiple tasks are requested, the service does not treat them as independent units. Instead, it constructs a **workflow**, which represents a deterministic sequence of task executions. In this model, the output of one task becomes the input of the next, forming a linear pipeline of computation. This sequencing is implemented by dynamically overriding the `start` method of the initial task, allowing it to coordinate execution of all subsequent tasks in order.

The service relies on a **task type mapping** to resolve logical task identifiers into concrete implementations within the `TaskProvider`. This indirection decouples task orchestration from task behavior, allowing the system to evolve task logic independently of how tasks are created and executed.

Throughout execution, the Task Service does not directly manage business logic or side effects. Instead, it delegates execution to `Task` instances, which encapsulate runtime behavior, progress tracking, and cancellation. This separation ensures that the service remains focused on orchestration concerns such as instantiation, sequencing, and state access.

---

## Table of Contents

* [Task Lifecycle and Execution Model](#task-lifecycle-and-execution-model)

  * [Secondary Concepts](#task-lifecycle-secondary-concepts)
* [Workflow Composition](#workflow-composition)

  * [Secondary Concepts](#workflow-secondary-concepts)
* [Task Resolution and Provider Integration](#task-resolution-and-provider-integration)

---

### Task Lifecycle and Execution Model <a name="task-lifecycle-and-execution-model"></a>

> *Tasks represent isolated, asynchronous units of work whose execution is managed externally but whose state transitions and progress reporting are internally controlled.*

#### Summary

The Task Service does not execute work directly; instead, it creates `Task` instances that encapsulate execution behavior. Each task follows a well-defined lifecycle, transitioning through states such as paused, running, and terminal states (completed or stopped).

Execution begins when the consumer invokes the `start` method on a task. At that point, control is transferred to the task’s internal execution function, which is invoked asynchronously and provided with a controlled interface (`TaskHandle`) for interacting with the system.

The lifecycle is intentionally **self-contained within the Task**, meaning the service does not intervene during execution. Instead, it relies on the task to report progress, manage its own termination conditions, and emit events describing its state. This design ensures that execution logic remains decoupled from orchestration.

Because tasks are single-run and non-restartable, each instance represents a discrete unit of computation. This aligns with the broader system model where tasks are treated as immutable execution records rather than reusable processes.

---

### Task Lifecycle and Execution Model | Secondary Concepts <a name="task-lifecycle-secondary-concepts"></a>

#### Execution Boundary

The execution boundary defines the separation between orchestration and computation. The Task Service is responsible for initiating execution, but once a task begins, all computation occurs within the task’s execution function. This ensures that business logic does not leak into the orchestration layer.

#### Progress as an Event Stream

Rather than exposing mutable state, tasks emit progress updates as discrete events appended to an internal timeline. This transforms execution into an observable event stream, allowing consumers to reconstruct task behavior without direct state mutation.

#### Cooperative Cancellation

Tasks are executed with an `AbortSignal`, enabling cooperative cancellation. Instead of being forcibly terminated, tasks are expected to respect the signal and halt execution gracefully when instructed.

#### Immutable Execution Model

Each task instance represents a single execution that cannot be restarted once it reaches a terminal state. This simplifies reasoning about task behavior and ensures that execution history remains consistent and auditable.

---

### Workflow Composition <a name="workflow-composition"></a>

> *Workflows model multi-step processes as linear compositions of tasks, where each step consumes the output of the previous step.*

#### Summary

When multiple tasks are requested, the Task Service constructs a workflow that represents a sequence of dependent computations. Rather than introducing a separate workflow abstraction, the system models workflows by enhancing the first task in the sequence to act as the orchestrator.

This orchestration is achieved by overriding the `start` method of the initial task so that it executes all subsequent tasks in series. Each task receives the result of the previous task as its input, forming a continuous chain of data transformation.

This design reflects a **railway-oriented programming model**, where execution follows a single track and progresses from one “station” (task) to the next. If a task encounters a failure condition and stops execution, downstream tasks are effectively bypassed, preserving the integrity of the workflow.

Because workflows are represented as a modified task rather than a separate construct, they integrate seamlessly with the rest of the system. From the perspective of the consumer, a workflow behaves like a single task, even though it encapsulates multiple execution steps internally.

---

### Workflow Composition | Secondary Concepts <a name="workflow-secondary-concepts"></a>

#### Sequential Composition

Tasks within a workflow are executed strictly in sequence. Each task awaits the completion of the previous one, ensuring deterministic execution order and consistent data flow.

#### Data Propagation

The output of each task becomes the input to the next. This creates a pipeline of transformations where data is incrementally refined as it moves through the workflow.

#### Implicit Orchestration

Instead of introducing a dedicated workflow engine, orchestration is embedded within the first task. This reduces system complexity while still enabling multi-step execution.

#### Failure Short-Circuiting

If a task stops execution (either due to error or explicit termination), subsequent tasks are not executed. This mirrors the “fail-fast” behavior common in railway-oriented systems.

---

### Task Resolution and Provider Integration <a name="task-resolution-and-provider-integration"></a>

> *Logical task identifiers are resolved into executable implementations through a provider layer, enabling decoupled and extensible task definitions.*

#### Summary

The Task Service does not contain task execution logic. Instead, it relies on a mapping layer that associates task identifiers with specific implementations defined in the `TaskProvider`.

When a task is requested, the service uses this mapping to determine the appropriate task type and retrieves the corresponding function from the provider. This allows tasks to be defined declaratively by name while keeping their implementations modular and isolated.

The provider layer groups tasks by domain and exposes them as structured namespaces. This organization enables the system to support a wide range of task types without increasing complexity within the service itself.

By separating task resolution from execution, the system achieves a high degree of flexibility. New tasks can be introduced by updating the provider and mapping configuration without requiring changes to the orchestration layer.

---

### Architectural Implications

The Task Service embodies several key architectural principles:

* **Separation of concerns**: orchestration, execution, and business logic are cleanly isolated
* **Composability**: tasks can be combined into workflows without additional infrastructure
* **Determinism**: execution order and data flow are predictable and explicit
* **Observability**: task progress is captured as an event timeline
* **Extensibility**: new task types can be added without modifying the service

---

### Conceptual Model

| Concept       | Role in System                         |
| ------------- | -------------------------------------- |
| Task Service  | Orchestrates creation and sequencing   |
| Task          | Encapsulates execution and state       |
| Task Provider | Supplies task implementations          |
| Workflow      | Represents sequential task composition |
| Task Handle   | Interface for controlled execution     |

---

### Mental Model

The system can be understood as a **data pipeline over time**:

```txt
Input → Task → Task → Task → Output
```

* The **Task Service** builds the pipeline
* Each **Task** transforms the data
* The **workflow** defines the path
* The **result** emerges at the end of the chain

This framing aligns closely with railway-oriented programming, where computation is modeled as a controlled, linear progression with well-defined transitions between steps.
