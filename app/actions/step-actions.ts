"use server";

import { SessionManager } from "@/lib/auth/session-manager";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { ApiLogger } from "@/lib/api/api-logger";
import type { StepId } from "@/lib/steps/step-refs";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
  StepDefinition,
} from "@/lib/types";

/**
 * Dynamically load a step definition by ID.
 */
async function getStep(stepId: StepId): Promise<StepDefinition | undefined> {
  const { allStepDefinitions } = await import("@/lib/steps");
  return allStepDefinitions.find((s) => s.id === stepId);
}

/**
 * Ensure the current NextAuth session is valid before executing a step.
 */
async function validateSession(): Promise<{
  valid: boolean;
  error?: StepCheckResult;
}> {
  const validation = await SessionManager.validate();
  if (!validation.valid) {
    return {
      valid: false,
      error: {
        completed: false,
        message: validation.error?.message,
        outputs: {
          errorCode: validation.error?.code ?? "AUTH_EXPIRED",
          requiresFullReauth: true,
          errorProvider: validation.error?.provider,
        },
      },
    };
  }
  return { valid: true };
}

/**
 * Invoke the `check` function of a step in a validated session context.
 */
export async function executeStepCheck(
  stepId: StepId,
  context: StepContext,
): Promise<StepCheckResult> {
  const logger = new ApiLogger();
  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid) return sessionValidation.error!;

    const step = await getStep(stepId);
    if (!step?.check) {
      return { completed: false, message: "No check logic for this step." };
    }

    const result = await step.check({ ...context, logger });
    const enrichedResult = {
      ...result,
      outputs: {
        ...(result.outputs || {}),
        inputs: step.inputs ?? [],
        expectedOutputs: step.outputs ?? [],
      },
    };
    return enrichedResult;
  } catch (error) {
    console.error(`[StepCheck] Unhandled exception for step ${stepId}:`, error);
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

/**
 * Execute the automation logic for a step and return the structured result.
 */
export async function executeStepAction(
  stepId: StepId,
  context: StepContext,
): Promise<StepExecutionResult> {
  const logger = new ApiLogger();
  context.logger = logger;

  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid && sessionValidation.error) {
      logger.addLog("[StepAction] Session validation failed.");
      return {
        success: false,
        error: {
          message: sessionValidation.error.message || "Authentication required",
          code: "AUTH_EXPIRED",
        },
        outputs: sessionValidation.error.outputs,
      };
    }

    const step = await getStep(stepId);
    if (!step?.execute) {
      return {
        success: false,
        error: {
          message: "No execution logic for this step.",
          code: "NO_EXECUTE_FUNCTION",
        },
      };
    }

    const result = await step.execute(context);
    return result;
  } catch (error) {
    logger.addLog(
      `[StepAction] Unhandled exception for step ${stepId}: ${error}`,
    );
    const isAuthError = isAuthenticationError(error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "An unknown error occurred.",
        code: isAuthError ? "AUTH_EXPIRED" : "EXECUTION_ERROR",
      },
      outputs: {
        errorCode: isAuthError ? "AUTH_EXPIRED" : "EXECUTION_ERROR",
        errorMessage: String(error),
        errorProvider: isAuthError ? error.provider : undefined,
      },
    };
  }
}
