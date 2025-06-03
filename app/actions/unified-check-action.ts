"use server";

import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkStep } from "./step-registry";

export async function executeStepCheck(
  stepId: string,
  context: StepContext
): Promise<StepCheckResult> {
  try {
    return await checkStep(stepId, context);
  } catch (error) {
    // For authentication errors, propagate them to the client
    if (isAuthenticationError(error)) {
      throw {
        code: "AUTH_EXPIRED",
        message: error.message,
        provider: error.provider,
      };
    }
    // For other errors, throw them as is
    throw error;
  }
}
