import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatenate class names using `clsx` and merge Tailwind overrides.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate that required step outputs are present before execution.
 *
 * @param outputs - Current step outputs object
 * @param required - Keys that must be present
 * @returns Object with validity flag and list of missing keys
 */
export function validateRequiredOutputs(
  outputs: Record<string, unknown>,
  required: string[],
): { valid: boolean; missing: string[] } {
  const missing = required.filter((k) => !outputs[k]);
  return { valid: missing.length === 0, missing };
}
