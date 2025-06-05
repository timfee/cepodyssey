# AI Agent Instructions for the Step Engine (`lib/steps/`)

## Purpose of this Directory

This directory is the core of the automation logic. Each sub-folder represents a self-contained automation step with its own definition (`index.ts`), a status-checking function (`check.ts`), and an execution function (`execute.ts`). The `registry.ts` file serves as the single public API for this system, ensuring that all steps are called in a consistent manner.

## Core Principles

- **Modularity:** Steps should be entirely self-contained and not depend on the internal logic of other steps.
- **Data Flow:** Data should only be passed between steps via the `context.outputs` object, using keys defined in `lib/types.ts`.
- **Abstraction:** All boilerplate logic (validation, error handling) must be handled by the provided wrappers and factories in `lib/steps/utils/`.

---

### 🚨 CRITICAL WARNING: The Google `customerId` Requirement 🚨

**THIS IS THE MOST COMMON CAUSE OF REGRESSIONS. YOU MUST PAY ATTENTION TO THIS RULE.**

Several Google Admin SDK API calls are scoped to a specific customer account. Calling them without the `customerId` will result in a **runtime 403 Forbidden error**, even if the code passes type checks.

- **Source:** The `customerId` is produced by the `verify-domain` step (`G-4`).
- **Key:** `OUTPUT_KEYS.GOOGLE_CUSTOMER_ID`
- **Rule:** Any `execute` function that calls an admin-level Google API **MUST** require and pass the `customerId`.

**EXAMPLE OF A REGRESSION (INCORRECT):**

```typescript
// This code is WRONG. It will cause runtime errors.
export const executeGrantSuperAdmin = withExecutionHandling({
  stepId: STEP_IDS.GRANT_SUPER_ADMIN,
  requiredOutputs: [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL], // FORGOT to require customerId
  executeLogic: async (context) => {
    // ...
    // The customerId is NOT retrieved from context.
    await google.assignAdminRole(token, email, '3', undefined, context.logger); // ERROR: Passing undefined
    // ...
  },
});
```

**EXAMPLE OF THE CORRECT PATTERN:**

```typescript
// This code is CORRECT.
export const executeGrantSuperAdmin = withExecutionHandling({
  stepId: STEP_IDS.GRANT_SUPER_ADMIN,
  requiredOutputs: [
    OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
    OUTPUT_KEYS.GOOGLE_CUSTOMER_ID, // 1. Dependency is declared here.
  ],
  executeLogic: async (context) => {
    // ...
    // 2. Value is retrieved from context.
    const customerId = context.outputs[OUTPUT_KEYS.GOOGLE_CUSTOMER_ID] as string; 
    
    // 3. Value is passed to the API call.
    await google.assignAdminRole(token, email, '3', customerId, context.logger); 
    // ...
  },
});
```

---

### General Rules for Modifying Steps

1. **Use the Abstractions**: All `check.ts` files must use `createStepCheck`. All `execute.ts` files must use `withExecutionHandling`.
2. **Define Dependencies**: Accurately list all required keys from `context.outputs` in the `requiredOutputs: []` array for every check and execute function.
3. **Pass the Logger**: Inside your `executeLogic` and `checkLogic`, pass `context.logger` to any `lib/api/` function you call.
4. **Define `requires` in `index.ts`**: If a step's `execute` function depends on the successful completion of another step, define the `requires: [STEP_IDS.SOME_OTHER_STEP]` array in the step definition.
