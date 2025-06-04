"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG7AssignGoogleSamlToRootOu } from "@/app/actions/execution-actions";

export async function executeAssignSamlProfile(context: StepContext): Promise<StepExecutionResult> {
  return executeG7AssignGoogleSamlToRootOu(context);
}
