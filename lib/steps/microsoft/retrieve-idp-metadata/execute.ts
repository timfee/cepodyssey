"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM8RetrieveAzureIdpMetadata } from "@/app/actions/execution-actions";

export async function executeRetrieveIdpMetadata(context: StepContext): Promise<StepExecutionResult> {
  return executeM8RetrieveAzureIdpMetadata(context);
}
