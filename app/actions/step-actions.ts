"use server";

import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types";
import { checkStep, executeStep } from "@/lib/steps/registry";

export async function executeStepCheck(
  stepId: string,
  context: StepContext,
): Promise<StepCheckResult> {
  try {
    return await checkStep(stepId, context);
  } catch (error) {
    // For authentication errors, return a proper StepCheckResult instead of throwing
    if (isAuthenticationError(error)) {
      return {
        completed: false,
        message: error.message,
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: error.provider,
          errorMessage: error.message,
        },
      };
    }

    // For other errors, convert to StepCheckResult
    if (error instanceof Error) {
      return {
        completed: false,
        message: error.message,
        outputs: {
          errorCode: "UNKNOWN_ERROR",
          errorMessage: error.message,
        },
      };
    }

    // Fallback for non-Error objects
    return {
      completed: false,
      message: "Something went wrong. Please try again.",
      outputs: {
        errorCode: "UNKNOWN_ERROR",
        errorMessage: String(error),
      },
    };
  }
}

export async function executeStepAction(
  stepId: string,
  context: StepContext,
): Promise<StepExecutionResult> {
  return executeStep(stepId, context);
}
