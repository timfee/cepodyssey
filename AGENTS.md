# Top-Level AI Agent Instructions

**Core Principle:** Your primary goal is to write clean, maintainable code that adheres to the established architectural patterns. Do not introduce new patterns without a compelling reason. Preventing regressions is paramount.

## ✅ MANDATORY Pre-Submission Workflow ✅

Before you propose any patch, you **MUST** follow this workflow. Failure to do so will result in your changes being rejected.

1. **Generate Code:** Generate all necessary code changes to fulfill the user's request.
2. **Run Linter:** Run `pnpm lint --fix` and ensure there are no linting errors.
3. **Run Type-Check (CRITICAL):** Run `pnpm type-check`.
    * If `tsc` reports any errors, your task is **NOT** complete.
    * **You MUST resolve all TypeScript errors before proceeding.**
    * Analyze the `type-check.log` or console output to understand the errors. The type system is the primary defense against regressions.
4. **Propose Patch:** Only after the type-check passes without errors can you create and propose the patch.

**Do not propose a patch that fails the type-check.**

---

### Critical Rules for All Code Changes

1. **Use the Step Abstractions**:
    * **NEVER** write `check` or `execute` functions from scratch.
    * **ALWAYS** use the `createStepCheck` factory (`lib/steps/utils/check-factory.ts`) for all `check.ts` files.
    * **ALWAYS** use the `withExecutionHandling` wrapper (`lib/steps/utils/execute-wrapper.ts`) for all `execute.ts` files. This handles boilerplate validation and `try/catch` logic automatically.

2. **Pass the Logger**:
    * The `ApiLogger` instance is critical for debugging.
    * It is available in the `context` object as `context.logger`.
    * **ALWAYS** pass `context.logger` as the final parameter to any function in `lib/api/` that makes an external network request (e.g., `google.getUser(..., context.logger)`).

3. **Handle the Google `customerId` Correctly**:
    * Several Google Admin SDK calls require a `customerId`. This is not optional and will cause runtime 403 errors if missed.
    * The `customerId` is produced by the `verify-domain` step (`G-4`) and is available as `context.outputs[OUTPUT_KEYS.GOOGLE_CUSTOMER_ID]`.
    * Any `execute` function that calls an admin-level Google API **MUST** list `OUTPUT_KEYS.GOOGLE_CUSTOMER_ID` in its `requiredOutputs` and pass the value to the API function.

4. **Adhere to API Function Contracts**:
    * All API functions in `lib/api/` must follow standardized return patterns.
    * **`get` functions** must return `Promise<Resource | null>`.
    * **`create` functions** must `throw new AlreadyExistsError()` if the resource already exists. They should **NOT** return special objects like `{ alreadyExists: true }`.
