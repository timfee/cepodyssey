"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftProvisioningJobDetails } from "@/app/actions/check-actions";

export async function checkAuthorizeProvisioning(context: StepContext): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string | undefined;
  if (!spId) {
    return { completed: false, message: "Service Principal ID not found." };
  }
  if (jobId) {
    const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
    if (result.completed) return result;
  }
  if (context.outputs[OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]) {
    return { completed: true, message: "Provisioning connection marked authorized." };
  }
  return { completed: false, message: "Provisioning connection not yet authorized." };
}
