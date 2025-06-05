# Redux State Management (`lib/redux/`)

This directory contains all Redux Toolkit configuration.

-   **Slices**: The state is divided into logical slices.
    -   `app-config.ts`: Stores the domain, tenant ID, and all collected step outputs.
    -   `setup-steps.ts`: Tracks the UI status (`pending`, `completed`, etc.) of each step.
    -   `errors.ts`: Manages the state for the `GlobalErrorModal`.
    -   `modals.ts`: Manages the state for any other modals (e.g., "Ask Admin").
    -   `debug-panel.ts`: Stores API logs for the debug panel.
-   **Store**: `store.ts` configures and exports the single Redux store.
-   **Persistence**: `persistence.ts` handles saving and loading step progress to/from `localStorage`, keyed by domain.
