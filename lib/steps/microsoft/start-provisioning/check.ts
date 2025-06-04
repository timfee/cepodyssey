"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftProvisioningJobDetails } from "@/app/actions/check-actions";

export async function checkStartProvisioning(context: StepContext): Promise<StepCheckResult> {
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
