# Project Architecture Guidelines

This document outlines the core architectural principles of the Directory Setup Assistant.

## Core Principles

1.  **Clear Client/Server Separation**: This project uses the Next.js App Router. **Server Actions are the *only* way the client communicates with the backend**. Server Actions must never throw exceptions; they always return a serializable result object (`{ success: true, ... }` or `{ success: false, error: {...} }`).

2.  **Request-Scoped Logic**: All server-side operations are stateless. For tasks like logging that require context through a call stack, a new `ApiLogger` instance is created at the start of the server action and passed down through all subsequent functions. This avoids race conditions and memory leaks associated with global singletons.

3.  **Predictable State Management**: The client-side state is managed by Redux Toolkit and is considered the single source of truth for the UI. The UI is a reactive function of this state. State is only ever updated based on the data returned from Server Actions.

4.  **Structured and Self-Contained Steps**: All automation logic is broken into discrete steps defined in `lib/steps/`. Each step is a self-contained module with its own definition, `check` function, and `execute` function. A central registry in `lib/steps/registry.ts` orchestrates these steps.

5.  **Modal-Based Error Handling**: All user-facing errors are handled by a global error modal, which is triggered by dispatching to a Redux `errors` slice. This provides a consistent and actionable way to inform the user of issues, especially for recoverable errors like session expiry. Toast notifications (`sonner`) have been entirely removed.

## Directory Structure

-   **/app**: Next.js App Router, routing, pages, and layouts.
    -   **/app/actions**: All Server Actions. The application's backend lives here.
    -   **/app/(auth)**: Authentication-related routes and `next-auth` configuration.
-   **/components**: All React components.
    -   **/components/ui**: Core UI elements from `shadcn/ui`.
    -   **/components/workflow**: Custom components for the automation workflow, like the `WorkflowStepCard`.
-   **/hooks**: Reusable client-side React hooks.
-   **/lib**: Core application logic, shared utilities, and type definitions.
    -   **/lib/api**: API clients for Google and Microsoft. Contains the `ApiLogger`.
    -   **/lib/error-handling**: The global `ErrorManager`.
    -   **/lib/redux**: Redux Toolkit store, slices, and state management.
    -   **/lib/steps**: The heart of the automation logic, containing all step definitions.
    -   **/lib/types.ts**: Central TypeScript definitions.
