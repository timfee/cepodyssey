# Redux State Management (`lib/redux/`)

This directory contains all Redux Toolkit configuration.

- **Slices**: The state is divided into logical slices.
  - `app-state.ts`: Combines configuration info and setup step status.
  - `ui-state.ts`: Manages errors, modals, and the debug panel.
- **Store**: `store.ts` configures and exports the single Redux store.
- **Persistence**: `persistence.ts` handles saving and loading step progress to/from `localStorage`, keyed by domain.
