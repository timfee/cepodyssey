"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG2CreateProvisioningUser } from "@/app/actions/execution-actions";

export async function executeCreateProvisioningUser(context: StepContext): Promise<StepExecutionResult> {
  return executeG2CreateProvisioningUser(context);
}
