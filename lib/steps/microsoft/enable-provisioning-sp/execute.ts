"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM2ConfigureProvisioningAppProperties } from "@/app/actions/execution-actions";

export async function executeEnableProvisioningSp(context: StepContext): Promise<StepExecutionResult> {
  return executeM2ConfigureProvisioningAppProperties(context);
}
