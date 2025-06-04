import { allStepDefinitions } from "./index";
import type { StepCheckResult, StepContext, StepExecutionResult } from "@/lib/types";

export async function checkStep(
  stepId: string,
  context: StepContext
): Promise<StepCheckResult> {
  const step = allStepDefinitions.find((s) => s.id === stepId);
  if (!step) {
    return { completed: false, message: `Step ${stepId} not found` };
  }
  if (!step.check) {
    return { completed: false, message: "No check available for this step." };
  }
  return step.check(context);
}

export async function executeStep(
  stepId: string,
  context: StepContext
): Promise<StepExecutionResult> {
  const step = allStepDefinitions.find((s) => s.id === stepId);
  if (!step) {
    return {
      success: false,
      error: { message: `Step ${stepId} not found`, code: "RESOURCE_NOT_FOUND" },
    };
  }
  if (!step.execute) {
    return {
      success: false,
      error: { message: "No execution available for this step.", code: "UNKNOWN_ERROR" },
    };
  }
  return step.execute(context);
}
