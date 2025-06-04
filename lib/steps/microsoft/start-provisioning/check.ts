"use server";

/**
 * Check whether the provisioning job has been started in Azure.
 * The job must exist and have an Active state.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftProvisioningJobDetails } from "../utils/common-checks";

export async function checkStartProvisioning(
  context: StepContext,
): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
  if (!spId || !jobId) {
    return { completed: false, message: "Missing configuration." };
  }
  const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
  if (result.completed && result.outputs?.provisioningJobState === "Active") {
    return { completed: true, message: "Provisioning job is active." };
  }
  return { completed: false, message: "Provisioning job is not active." };
}
