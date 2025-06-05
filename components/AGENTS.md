# AI Agent Instructions for Components

When building or refactoring React components, follow these principles to ensure a clean and maintainable UI codebase.

1. **No Prop Drilling**:
    * A prop should **NOT** be passed down through more than two component layers.
    * If data is core application state (user info, step outputs), use the `useAppSelector` hook from Redux to access it directly in the component that needs it.
    * If data is localized UI state shared between a few components in one area (e.g., state for a multi-page form), use the React Context API.

2. **Component Decomposition**:
    * Keep components small and focused on a single responsibility.
    * **The Three-Condition Rule:** If a component's JSX contains more than three separate conditional rendering blocks (`&&` or `? :`), it is a strong sign it needs to be broken down into smaller, specialized components.
    * For example, instead of a single large component managing loading, error, and data states, create a "dispatcher" component that renders one of `<LoadingState>`, `<ErrorState>`, or `<DataState>`.
