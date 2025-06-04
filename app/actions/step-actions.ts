"use server";

import { checkStep, executeStep } from "@/lib/steps/registry";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types";

export async function executeStepCheck(
  stepId: string,
  context: StepContext,
): Promise<StepCheckResult> {
  try {
    return await checkStep(stepId, context);
  } catch (error) {
    if (error instanceof Error) {
      return {
        completed: false,
        message: error.message,
        outputs: {
          errorCode: "EXECUTION_ERROR",
          errorMessage: error.message,
        },
      };
    }
    return { completed: false, message: "An unknown error occurred" };
  }
}

export async function executeStepAction(
  stepId: string,
  context: StepContext,
): Promise<StepExecutionResult> {
  return executeStep(stepId, context);
}
