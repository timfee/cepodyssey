"use server";

/**
 * Verify that default attribute mappings exist on the provisioning job.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftAttributeMappingsApplied } from "../utils/common-checks";

export async function checkAttributeMappings(context: StepContext): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
  if (!spId || !jobId) {
    return { completed: false, message: "Missing configuration." };
  }
  return checkMicrosoftAttributeMappingsApplied(spId, jobId);
}
