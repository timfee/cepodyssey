"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeG3GrantAdminToProvisioningUser } from "@/app/actions/execution-actions";

export async function executeGrantSuperAdmin(context: StepContext): Promise<StepExecutionResult> {
  return executeG3GrantAdminToProvisioningUser(context);
}
