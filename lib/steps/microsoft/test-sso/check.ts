"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";

export async function checkTestSso(_context: StepContext): Promise<StepCheckResult> {
  return { completed: false, message: "Manual testing required." };
}
