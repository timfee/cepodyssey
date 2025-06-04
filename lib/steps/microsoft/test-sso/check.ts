"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";

export async function checkTestSso(
  context: StepContext,
): Promise<StepCheckResult> {
  if (context.outputs[OUTPUT_KEYS.FLAG_M10_SSO_TESTED]) {
    return { completed: true, message: "SSO sign-in tested." };
  }
  return { completed: false, message: "Manual testing required." };
}
