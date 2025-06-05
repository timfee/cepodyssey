# Library (`lib/`) Guidelines

The `lib/` directory contains the core business logic of the application, independent of the Next.js routing or React rendering layers.

## Key Directories

-   **`/api`**: Contains clients for external services (Google, Microsoft). The `ApiLogger` and `APIError` classes are defined here. All external calls must go through these clients.
-   **`/error-handling`**: Home of the `ErrorManager`, which standardizes how errors are processed and dispatched to the Redux store for UI display.
-   **`/redux`**: Contains all Redux Toolkit setup.
    -   `/slices`: Each slice defines a piece of the client-side state (`appConfig`, `setupSteps`, `errors`, `modals`, `debugPanel`).
    -   `store.ts`: Configures the Redux store.
-   **`/steps`**: The core automation engine.
    -   Each step is a folder containing its definition (`index.ts`), a `check.ts` file, and an `execute.ts` file. This makes steps modular and easy to manage.
    -   `registry.ts` is the public interface for the step system, used by Server Actions.
-   **`/types.ts`**: Centralized, critical TypeScript types used across the entire application, such as `StepDefinition`, `StepContext`, `StepExecutionResult`, and `StepCheckResult`.
-   **`/utils.ts`**: General-purpose, stateless utility functions.
