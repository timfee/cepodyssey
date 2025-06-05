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

/**
 * Safely read a value from a step's outputs record.
 * Returns `undefined` if the key is missing instead of throwing.
 */
export function getOutputValue<T>(
  outputs: Record<string, unknown>,
  key: string,
): T | undefined {
  const value = outputs[key];
  if (value === undefined || value === null) return undefined;
  return value as T;
}
