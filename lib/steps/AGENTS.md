# AI Agent Instructions for the Step Engine (`lib/steps/`)

When creating or modifying any automation step, you **MUST** follow these rules to maintain the integrity of the framework.

## Rules for `check.ts` files

1. **Use the Factory**: Every `check.ts` file must export a single constant defined with the `createStepCheck` factory. Do not write a standalone `async function`.
2. **Define Dependencies**: In the `createStepCheck` options, accurately list all necessary keys from `context.outputs` in the `requiredOutputs: []` array. The factory handles the boilerplate of checking for them.
3. **Focus on Logic**: The `checkLogic` function you provide should contain only the unique logic for checking the step's status. It should return a `StepCheckResult` (`{ completed: boolean, message: string, outputs?: {...} }`).

### Rules for `execute.ts` files

1. **Use the Wrapper**: Every `execute.ts` file must export a single constant defined with the `withExecutionHandling` wrapper.
2. **Define Dependencies**: In the `withExecutionHandling` options, accurately list all necessary keys from `context.outputs` in the `requiredOutputs: []` array. The wrapper handles validation.
3. **Pass the Logger**: Inside your `executeLogic` function, you have access to `context.logger`. You **MUST** pass this logger instance to any `lib/api/` function you call.
    * **Correct:** `await google.someFunction(token, data, context.logger);`
    * **Incorrect:** `await google.someFunction(token, data);`
4. **Handle `customerId`**: If the step calls a Google Admin SDK function, you **MUST** include `OUTPUT_KEYS.GOOGLE_CUSTOMER_ID` in `requiredOutputs` and pass it to the API call.

### Rules for `index.ts` (Step Definition) files

1. **Define `requires`**: If a step's `execute` function depends on the successful completion of another step, you must define the `requires: [STEP_IDS.SOME_OTHER_STEP]` array in the step definition.
