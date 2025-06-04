"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM5StartProvisioningJob } from "@/app/actions/execution-actions";

export async function executeStartProvisioning(context: StepContext): Promise<StepExecutionResult> {
  return executeM5StartProvisioningJob(context);
}
