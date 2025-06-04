"use server";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";

export async function executeTestSso(
  _context: StepContext,
): Promise<StepExecutionResult> {
  return {
    success: true,
    message:
      "Test SSO: \n1. Open a new Incognito/Private browser window. \n2. Navigate to a Google service...",
    resourceUrl: portalUrls.azure.myApps(),
    outputs: {
      [OUTPUT_KEYS.FLAG_M10_SSO_TESTED]: true,
    },
  };
}
