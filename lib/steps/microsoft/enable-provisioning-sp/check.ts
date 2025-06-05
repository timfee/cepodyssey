"use server";

/**
 * Verify the service principal for provisioning is enabled in Azure AD.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftServicePrincipalEnabled } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

export async function checkEnableProvisioningSp(
  context: StepContext,
): Promise<StepCheckResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
  if (!spId) {
    return {
      completed: false,
      message: "Service Principal ID not found.",
      outputs: {
        inputs: getStepInputs(STEP_IDS.ENABLE_PROVISIONING_SP),
        expectedOutputs: getStepOutputs(STEP_IDS.ENABLE_PROVISIONING_SP),
      },
    };
  }
  const result = await checkMicrosoftServicePrincipalEnabled(spId);
  return {
    ...result,
    outputs: {
      ...(result.outputs || {}),
      producedOutputs: result.completed
        ? getStepOutputs(STEP_IDS.ENABLE_PROVISIONING_SP).map((o) => ({
            ...o,
            value: result.outputs?.spId,
          }))
        : undefined,
      inputs: getStepInputs(STEP_IDS.ENABLE_PROVISIONING_SP).map((inp) => ({
        ...inp,
        data: { ...inp.data, value: context.outputs[inp.data.key!] },
      })),
      expectedOutputs: getStepOutputs(STEP_IDS.ENABLE_PROVISIONING_SP),
    },
  };
}
