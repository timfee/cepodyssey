"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG6UpdateGoogleSamlWithAzureIdp } from "@/app/actions/execution-actions";

export async function executeUpdateSamlProfile(context: StepContext): Promise<StepExecutionResult> {
  return executeG6UpdateGoogleSamlWithAzureIdp(context);
}
