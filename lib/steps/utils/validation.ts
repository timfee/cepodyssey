import type { StepContext, StepExecutionResult } from "@/lib/types";

/**
 * Validates that required outputs are present in the context.
 *
 * @param context - The step execution context
 * @param requiredKeys - Array of OUTPUT_KEYS that must be present
 * @param stepHint - Optional hint about which steps should have provided these outputs
 * @returns Validation result with error details if invalid
 */
export function validateRequiredOutputs(
  context: StepContext,
  requiredKeys: string[],
  stepHint?: string,
): { valid: boolean; error?: StepExecutionResult["error"] } {
  const missing = requiredKeys.filter((key) => !context.outputs[key]);

  if (missing.length > 0) {
    const hint = stepHint ? ` Ensure ${stepHint} completed successfully.` : "";
    return {
      valid: false,
      error: {
        message: `Missing required outputs: ${missing.join(", ")}.${hint}`,
        code: "MISSING_DEPENDENCY",
      },
    };
  }

  if (!context.domain || !context.tenantId) {
    const missingConfig = [] as string[];
    if (!context.domain) missingConfig.push("domain");
    if (!context.tenantId) missingConfig.push("tenantId");

    return {
      valid: false,
      error: {
        message: `Missing required configuration: ${missingConfig.join(", ")}.`,
        code: "MISSING_CONFIG",
      },
    };
  }

  return { valid: true };
}
