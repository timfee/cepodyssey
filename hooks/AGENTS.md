# Custom Hooks (`hooks/`)

-   **`useAppDispatch`, `useAppSelector`**: Typed wrappers for the standard Redux hooks. Use these in all client components to interact with the Redux store.
-   **`useStepExecution`**: Orchestrates calling a step's server action, handling the `in_progress` state, and dispatching the final result (success or failure) to the Redux store.
-   **`useErrorHandler`**: A simple hook to dispatch errors to the global error slice, triggering the `GlobalErrorModal`.
-   **`useSessionSync`**: Manages session state, keeping the Redux store in sync with the NextAuth session, particularly for domain and tenant ID.
