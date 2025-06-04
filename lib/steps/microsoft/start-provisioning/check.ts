"use server";

/**
 * Check whether the provisioning job has been started in Azure.
 * The job must exist and have an Active state.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftProvisioningJobDetails } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkStartProvisioning(
  context: StepContext,
): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
  if (!spId || !jobId) {
    return {
      completed: false,
      message: "Missing configuration.",
      outputs: { inputs: getStepInputs("M-5"), expectedOutputs: getStepOutputs("M-5") },
    };
  }
  const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
  if (result.completed && result.outputs?.provisioningJobState === "Active") {
    return {
      completed: true,
      message: "Provisioning job is active.",
      outputs: {
        producedOutputs: getStepOutputs("M-5"),
        inputs: getStepInputs("M-5").map((inp) => ({
          ...inp,
          data: { ...inp.data, value: context.outputs[inp.data.key!] },
        })),
      },
    };
  }
  return {
    completed: false,
    message: "Provisioning job is not active.",
    outputs: { inputs: getStepInputs("M-5"), expectedOutputs: getStepOutputs("M-5") },
  };
}
