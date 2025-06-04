"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { executeM7ConfigureAzureSamlAppSettings } from "@/app/actions/execution-actions";

export async function executeConfigureSamlApp(context: StepContext): Promise<StepExecutionResult> {
  return executeM7ConfigureAzureSamlAppSettings(context);
}
