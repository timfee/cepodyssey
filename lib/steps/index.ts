/**
 * Aggregates all step definitions from Google and Microsoft providers.
 */
import type { StepDefinition } from "../types";
import { googleSteps } from "./google";
import { microsoftSteps } from "./microsoft";

export { googleSteps, microsoftSteps };

export const allStepDefinitions: StepDefinition[] = [
  ...googleSteps,
  ...microsoftSteps,
];

export const stepDefinitionMap = new Map<string, StepDefinition>(
  allStepDefinitions.map((def) => [def.id, def]),
);

// Utility stub for tests
export const mockStep = {
  check: async () => ({ completed: true }),
};
