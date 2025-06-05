# AI Agent Instructions for Components

## Purpose of this Directory

This directory contains all React components for the application, following a "feature-sliced" approach where UI logic (`components/ui`), workflow elements (`components/workflow`), and top-level components are organized separately.

### Core Principles

- **Composition**: Build complex UIs by composing smaller, single-purpose components.
- **State Management**: Use the right tool for state. Global state lives in Redux; localized UI state can use React Context or local component state.

---

### Strict Agent Rules

1. **No Prop Drilling**:

   - A prop should **NOT** be passed down through more than two component layers.
   - If data is core application state (user info, step outputs), use the `useAppSelector` hook from Redux to access it directly in the component that needs it.
   - If data is localized UI state (e.g., state for a multi-part form), use the React Context API.

2. **Component Decomposition**:
   - **The Three-Condition Rule:** If a component's JSX contains more than three separate conditional rendering blocks (`&&` or `? :`), it must be broken down into smaller, specialized components. For example, a component managing loading, error, and data states should be split into a dispatcher that renders one of `<LoadingState>`, `<ErrorState>`, or `<DataState>`.
