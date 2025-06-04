"use server";

import { auth } from "@/app/(auth)/auth";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types";
import { checkStep, executeStep } from "@/lib/steps/registry";

async function validateSession(): Promise<{ valid: boolean; error?: StepCheckResult }> {
  const session = await auth();

  if (!session) {
    return {
      valid: false,
      error: {
        completed: false,
        message: "No active session. Please sign in.",
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: "both",
        },
      },
    };
  }

  if (!session.googleToken || !session.hasGoogleAuth) {
    return {
      valid: false,
      error: {
        completed: false,
        message: "Google authentication required. Please sign in with Google.",
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: "google",
        },
      },
    };
  }

  if (!session.microsoftToken || !session.hasMicrosoftAuth) {
    return {
      valid: false,
      error: {
        completed: false,
        message:
          "Microsoft authentication required. Please sign in with Microsoft.",
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: "microsoft",
        },
      },
    };
  }

  return { valid: true };
}
export async function executeStepCheck(
  stepId: string,
  context: StepContext,
): Promise<StepCheckResult> {
  const sessionValidation = await validateSession();
  if (!sessionValidation.valid) {
    return sessionValidation.error!;
  }
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

  return executeStep(stepId, context);
}
