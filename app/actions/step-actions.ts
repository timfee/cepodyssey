"use server";

import { auth } from "@/app/(auth)/auth";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { checkStep, executeStep } from "@/lib/steps/registry";
import type { StepId } from "@/lib/steps/step-refs";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types";

// A single, reliable session validation function
async function validateSession(): Promise<{
  valid: boolean;
  error?: StepCheckResult;
}> {
  const session = await auth();
  if (!session?.user || !session.googleToken || !session.microsoftToken) {
    return {
      valid: false,
      error: {
        completed: false,
        message: "Your session is invalid. Please sign in to both services.",
        outputs: { errorCode: "AUTH_EXPIRED", requiresFullReauth: true },
      },
    };
  }
  return { valid: true };
}

export async function executeStepCheck(
  stepId: StepId,
  context: StepContext
): Promise<StepCheckResult> {
  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid) {
      return sessionValidation.error!;
    }

    // The registry now handles logger creation and log attachment
    return await checkStep(stepId, context);
  } catch (error) {
    console.error(`[StepCheck] Unhandled exception for step ${stepId}:`, error);
    // This catch block ensures we ALWAYS return a valid StepCheckResult
    if (isAuthenticationError(error)) {
      return {
        completed: false,
        message: error.message,
        outputs: { errorCode: "AUTH_EXPIRED", errorProvider: error.provider },
      };
    }
    return {
      completed: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred.",
      outputs: {
        errorCode: "UNKNOWN_CHECK_ERROR",
        errorMessage: String(error),
      },
    };
  }
}

export async function executeStepAction(
  stepId: StepId,
  context: StepContext
): Promise<StepExecutionResult> {
  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid && sessionValidation.error) {
      return {
        success: false,
        error: {
          message: sessionValidation.error.message || "Authentication required",
          code: "AUTH_EXPIRED",
        },
        outputs: sessionValidation.error.outputs,
      };
    }

    // The registry now handles logger creation and log attachment
    return await executeStep(stepId, context);
  } catch (error) {
    console.error(
      `[StepAction] Unhandled exception for step ${stepId}:`,
      error
    );
    // This catch block ensures we ALWAYS return a valid StepExecutionResult
    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Execution failed unexpectedly.",
        code: "EXECUTION_ERROR",
      },
      outputs: {
        errorCode: "EXECUTION_ERROR",
        errorMessage: String(error),
      },
    };
  }
}
