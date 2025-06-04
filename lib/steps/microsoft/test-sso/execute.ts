"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";

export async function executeTestSso(_context: StepContext): Promise<StepExecutionResult> {
  return {
    success: true,
    message: "Test SSO: \n1. Open a new Incognito/Private browser window. \n2. Navigate to a Google service...",
    resourceUrl: "https://myapps.microsoft.com",
  };
}
