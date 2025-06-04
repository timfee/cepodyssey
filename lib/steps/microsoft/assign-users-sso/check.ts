"use server";

/**
 * Check if any users or groups are assigned to the SAML SSO application.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftAppAssignments } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkAssignUsers(
  context: StepContext,
): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
  if (!spId) {
    return {
      completed: false,
      message: "SAML SSO SP ID not found.",
      outputs: { inputs: getStepInputs("M-9"), expectedOutputs: getStepOutputs("M-9") },
    };
  }
  const result = await checkMicrosoftAppAssignments(spId);
  return {
    ...result,
    outputs: result.completed
      ? {
          producedOutputs: getStepOutputs("M-9"),
          inputs: getStepInputs("M-9").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        }
      : {
          inputs: getStepInputs("M-9"),
          expectedOutputs: getStepOutputs("M-9"),
        },
  };
}
