"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM1CreateProvisioningApp } from "@/app/actions/execution-actions";

export async function executeCreateProvisioningApp(context: StepContext): Promise<StepExecutionResult> {
  return executeM1CreateProvisioningApp(context);
}
