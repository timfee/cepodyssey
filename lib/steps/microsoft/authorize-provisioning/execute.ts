"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM3AuthorizeProvisioningConnection } from "@/app/actions/execution-actions";

export async function executeAuthorizeProvisioning(context: StepContext): Promise<StepExecutionResult> {
  return executeM3AuthorizeProvisioningConnection(context);
}
