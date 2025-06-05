# Directory Setup Assistant

This Next.js application automates the integration of Google Workspace and Microsoft Entra ID using a step-by-step workflow. It features a React-based frontend, a robust server-action backend, and uses NextAuth.js for dual-provider authentication.

## Architecture Highlights

This project follows modern, resilient patterns for Next.js applications:

- **Modular Step Engine**: All automation logic is encapsulated in self-contained step modules within `lib/steps/`. Each step defines its own checks, execution logic, and metadata, making the system highly scalable and maintainable.

- **Abstraction Over Boilerplate**: Repetitive logic in steps (like input validation and error handling) is managed by higher-order functions (`withExecutionHandling`) and factories (`createStepCheck`). This keeps step definitions concise and focused on their core task.

- **Resilient Server Actions**: All backend logic resides in Server Actions (`app/actions/`). These actions are designed to **never throw exceptions** to the client. Instead, they always return a structured result object (`{ success: boolean, ... }`), ensuring predictable communication between the client and server.

- **Request-Scoped Logging**: API logging is handled by creating a new `ApiLogger` instance for every server request. This instance is passed down through the entire call chain (`context.logger`) to collect a complete trace of the operation, which is then returned to the client for debugging. This avoids the pitfalls of global state in a serverless environment.

- **Centralized Error Handling**: All user-facing errors are handled through a global error modal driven by a centralized `error-manager.ts`. This provides a consistent user experience and keeps error-handling logic out of individual UI components.
