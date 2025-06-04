"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM9AssignUsersToAzureSsoApp } from "@/app/actions/execution-actions";

export async function executeAssignUsers(context: StepContext): Promise<StepExecutionResult> {
  return executeM9AssignUsersToAzureSsoApp(context);
}
