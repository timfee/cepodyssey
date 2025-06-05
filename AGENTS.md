# Top-Level AI Agent Instructions

## Overall Goal

Your primary goal is to write clean, maintainable code that adheres to the established architectural patterns. Do not introduce new patterns without a compelling reason. Preventing regressions is paramount.

---

### ✅ MANDATORY Pre-Submission Workflow ✅

Before you propose any patch, you **MUST** follow this workflow in order.

1. **Generate Code:** Generate all necessary code changes.
2. **Run Linter:** Run `pnpm lint --fix`. Resolve all errors.
3. **Run Type-Check:** Run `pnpm type-check`. Resolve all TypeScript errors.
4. **Run Production Build (CRITICAL):** Run `pnpm build`. This step is essential for detecting runtime and structural errors, such as circular dependencies. **Do not propose a patch if the build fails.**
5. **Propose Patch:** Only after all previous steps pass without errors can you create and propose the patch.

**Do not propose a patch that fails these steps or if you cannot run them.**

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
