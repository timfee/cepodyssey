"use server";

import { checkStep } from "./step-registry";
import type { StepContext, StepCheckResult } from "@/lib/types";

export async function executeStepCheck(stepId: string, context: StepContext): Promise<StepCheckResult> {
  return checkStep(stepId, context);
}
