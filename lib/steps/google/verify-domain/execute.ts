"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG4AddAndVerifyDomain } from "@/app/actions/execution-actions";

export async function executeVerifyDomain(context: StepContext): Promise<StepExecutionResult> {
  return executeG4AddAndVerifyDomain(context);
}
