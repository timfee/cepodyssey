"use server";

/**
 * Determine whether the Azure provisioning connection has been authorized.
 * If a provisioning job exists and reports success, the step is complete.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftProvisioningJobDetails } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkAuthorizeProvisioning(
  context: StepContext,
): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as
    | string
    | undefined;
  if (!spId) {
    return {
      completed: false,
      message: "Service Principal ID not found.",
      outputs: { inputs: getStepInputs("M-3"), expectedOutputs: getStepOutputs("M-3") },
    };
  }
  if (jobId) {
    const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
    if (result.completed)
      return {
        ...result,
        outputs: {
          ...(result.outputs || {}),
          producedOutputs: getStepOutputs("M-3").map((o) => ({
            ...o,
            value: result.outputs ? result.outputs[o.key as keyof typeof result.outputs] : undefined,
          })),
          inputs: getStepInputs("M-3").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      };
  }
  if (context.outputs[OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]) {
    return {
      completed: true,
      message: "Provisioning connection marked authorized.",
      outputs: {
        producedOutputs: getStepOutputs("M-3"),
        inputs: getStepInputs("M-3").map((inp) => ({
          ...inp,
          data: { ...inp.data, value: context.outputs[inp.data.key!] },
        })),
      },
    };
  }
  return {
    completed: false,
    message: "Provisioning connection not yet authorized.",
    outputs: { inputs: getStepInputs("M-3"), expectedOutputs: getStepOutputs("M-3") },
  };
}
