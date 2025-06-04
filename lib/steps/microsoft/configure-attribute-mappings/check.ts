"use server";

/**
 * Verify that default attribute mappings exist on the provisioning job.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftAttributeMappingsApplied } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkAttributeMappings(
  context: StepContext,
): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
  if (!spId || !jobId) {
    return {
      completed: false,
      message: "Missing configuration.",
      outputs: { inputs: getStepInputs("M-4"), expectedOutputs: getStepOutputs("M-4") },
    };
  }
  const result = await checkMicrosoftAttributeMappingsApplied(spId, jobId);
  return {
    ...result,
    outputs: result.completed
      ? {
          producedOutputs: getStepOutputs("M-4"),
          inputs: getStepInputs("M-4").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        }
      : {
          inputs: getStepInputs("M-4"),
          expectedOutputs: getStepOutputs("M-4"),
        },
  };
}
