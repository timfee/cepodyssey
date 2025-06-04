"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM6CreateSamlSsoApp } from "@/app/actions/execution-actions";

export async function executeCreateSamlApp(context: StepContext): Promise<StepExecutionResult> {
  return executeM6CreateSamlSsoApp(context);
}
