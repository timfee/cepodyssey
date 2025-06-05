import type { StepContext } from "@/lib/types";

/**
 * Retrieve a required output value from the step context with type safety.
 * Throws an error if the value is undefined or null.
 */
export function getRequiredOutput<T>(context: StepContext, key: string): T {
  const value = context.outputs[key];
  if (value === undefined || value === null) {
    throw new Error(`Required output '${key}' is missing`);
  }
  return value as T;
}
