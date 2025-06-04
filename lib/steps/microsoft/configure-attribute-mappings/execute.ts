"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM4ConfigureProvisioningAttributeMappings } from "@/app/actions/execution-actions";

export async function executeConfigureAttributeMappings(context: StepContext): Promise<StepExecutionResult> {
  return executeM4ConfigureProvisioningAttributeMappings(context);
}
