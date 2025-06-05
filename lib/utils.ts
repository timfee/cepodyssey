import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { config } from "@/lib/config";

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

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Constructs a Google Admin Console URL for a SAML profile
 * @param profileFullName The full resource name (e.g., "inboundSamlSsoProfiles/12345")
 * @returns The properly formatted Admin Console URL
 */

/**
 * Determine if API debug logging is enabled.
 * Defaults to true in development unless explicitly disabled.
 */
export function isApiDebugEnabled(): boolean {
  const flag = config.NEXT_PUBLIC_ENABLE_API_DEBUG;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}
