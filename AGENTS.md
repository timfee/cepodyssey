# Top-Level AI Agent Instructions

## Overall Goal

Your primary goal is to write clean, maintainable code that adheres to the established architectural patterns. Do not introduce new patterns without a compelling reason. Preventing regressions is paramount.

---

### ✅ MANDATORY Pre-Submission Workflow ✅

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
    * **ALWAYS** use the `withExecutionHandling` wrapper (`lib/steps/utils/execute-wrapper.ts`) for all `execute.ts` files.

2. **Pass the Logger**:
    * The `ApiLogger` instance is critical for debugging. It is available as `context.logger`.
    * **ALWAYS** pass `context.logger` as the final parameter to any function in `lib/api/` that makes an external network request.

3. **Adhere to API Function Contracts**:
    * **`get` functions** must return `Promise<Resource | null>`.
    * **`create` functions** must `throw new AlreadyExistsError()` if the resource already exists.
