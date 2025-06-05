# Step Engine

Each folder defines an automation step with `check.ts`, `execute.ts` and `index.ts`.

- Wrap checks with `createStepCheck` and executes with `withExecutionHandling`.
- Declare all dependencies via `requiredOutputs` and `requires`.
- Pass `context.logger` to API helpers.
- Keep steps self-contained; share data only through `context.outputs`.
- Google Admin APIs must include `OUTPUT_KEYS.GOOGLE_CUSTOMER_ID` from the
  `verify-domain` step or they will fail with 403 errors.
