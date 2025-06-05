"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftServicePrincipal } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Verify the provisioning enterprise application exists in Azure AD.
 */
export async function checkProvisioningApp(
  context: StepContext,
): Promise<StepCheckResult> {
  const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
  if (!appId) {
    return {
      completed: false,
      message: "Provisioning App ID not found.",
      outputs: {
        inputs: getStepInputs(STEP_IDS.CREATE_PROVISIONING_APP),
        expectedOutputs: getStepOutputs(STEP_IDS.CREATE_PROVISIONING_APP),
      },
    };
  }
  const result = await checkMicrosoftServicePrincipal(appId);
  if (result.completed && result.outputs) {
    const outputs = {
      [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: result.outputs.spId,
      [OUTPUT_KEYS.PROVISIONING_APP_ID]: result.outputs.retrievedAppId,
      [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: result.outputs.appObjectId,
    };
    return {
      ...result,
      outputs: {
        ...outputs,
        producedOutputs: getStepOutputs(STEP_IDS.CREATE_PROVISIONING_APP).map((o) => ({
          ...o,
          value: outputs[o.key as keyof typeof outputs],
        })),
        inputs: getStepInputs(STEP_IDS.CREATE_PROVISIONING_APP).map((inp) => ({
          ...inp,
          data: { ...inp.data, value: context.outputs[inp.data.key!] },
        })),
      },
    };
  }
  return {
    ...result,
    outputs: {
      ...(result.outputs || {}),
      inputs: getStepInputs(STEP_IDS.CREATE_PROVISIONING_APP),
      expectedOutputs: getStepOutputs(STEP_IDS.CREATE_PROVISIONING_APP),
    },
  };
}
