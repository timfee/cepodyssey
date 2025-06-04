export interface ValidationResult {
  valid: boolean;
  error?: {
    message: string;
    code: string;
  };
}

import type { StepContext } from "@/lib/types";

export function validateRequiredOutputs(
  context: StepContext,
  requiredKeys: string[],
  stepHint?: string,
): ValidationResult {
  const missing = requiredKeys.filter((k) => !context.outputs[k]);
  if (missing.length > 0) {
    const hint = stepHint ? ` Ensure ${stepHint} completed successfully.` : "";
    return {
      valid: false,
      error: {
        message: `Complete these steps first: ${missing.join(", ")}.${hint}`,
        code: "MISSING_DEPENDENCY",
      },
    };
  }
  if (!context.domain || !context.tenantId) {
    const missingConfig: string[] = [];
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
