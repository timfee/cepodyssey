"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG5InitiateGoogleSamlProfile } from "@/app/actions/execution-actions";

export async function executeInitiateSamlProfile(context: StepContext): Promise<StepExecutionResult> {
  return executeG5InitiateGoogleSamlProfile(context);
}
