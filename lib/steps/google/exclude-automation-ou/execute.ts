"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG8ExcludeAutomationOuFromSso } from "@/app/actions/execution-actions";

export async function executeExcludeAutomationOu(context: StepContext): Promise<StepExecutionResult> {
  return executeG8ExcludeAutomationOuFromSso(context);
}
