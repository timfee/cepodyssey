# Step Automation Engine (`lib/steps/`)

This is the core of the automation logic.

- **Self-Contained Modules**: Each automation step is a folder containing its definition (`index.ts`), a `check.ts` file, and an `execute.ts` file. This makes steps modular and easy to manage.
- **`step-refs.ts`**: Defines all step IDs as constants to avoid magic strings and provide type safety.
- **`registry.ts`**: The public API for the step system. Server actions in `app/actions/` should **only** call `checkStep` and `executeStep` from the registry. The registry is responsible for finding the correct step module and creating the `ApiLogger` for the operation.
