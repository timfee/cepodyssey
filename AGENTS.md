# Top-Level AI Agent Instructions

**Core Principle:** Your primary goal is to write clean, maintainable code that adheres to the established architectural patterns. Do not introduce new patterns without a compelling reason. Preventing regressions is paramount.

## Critical Rules for All Code Changes

1. **Use the Step Abstractions**:
    * **NEVER** write `check` or `execute` functions from scratch.
    * **ALWAYS** use the `createStepCheck` factory (`lib/steps/utils/check-factory.ts`) for all `check.ts` files.
    * **ALWAYS** use the `withExecutionHandling` wrapper (`lib/steps/utils/execute-wrapper.ts`) for all `execute.ts` files. This handles boilerplate validation and `try/catch` logic automatically.

2. **Pass the Logger**:
    * The `ApiLogger` instance is critical for debugging.
    * It is available in the `context` object as `context.logger`.
    * **ALWAYS** pass `context.logger` as the final parameter to any function in `lib/api/` that makes an external network request (e.g., `google.getUser(..., context.logger)`).

3. **Handle the Google `customerId` Correctly**:
    * Several Google Admin SDK calls require a `customerId`. This is not optional.
    * The `customerId` is produced by the `verify-domain` step (`G-4`) and is available as `context.outputs[OUTPUT_KEYS.GOOGLE_CUSTOMER_ID]`.
    * Any `execute` function that calls an admin-level Google API **MUST** list `OUTPUT_KEYS.GOOGLE_CUSTOMER_ID` in its `requiredOutputs` and pass the value to the API function. Failure to do so will cause runtime errors.

4. **Adhere to API Function Contracts**:
    * All API functions in `lib/api/` must follow standardized return patterns.
    * **`get` functions** must return `Promise<Resource | null>`.
    * **`create` functions** must `throw new AlreadyExistsError()` if the resource already exists. They should **NOT** return special objects like `{ alreadyExists: true }`.
