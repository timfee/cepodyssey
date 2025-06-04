"use server";

/**
 * Check if the Azure SAML SSO application exists.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftServicePrincipal } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkCreateSamlApp(
  context: StepContext,
): Promise<StepCheckResult> {
  const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
  if (!appId) {
    return {
      completed: false,
      message: "SAML SSO App ID not found.",
      outputs: { inputs: getStepInputs("M-6"), expectedOutputs: getStepOutputs("M-6") },
    };
  }
  const result = await checkMicrosoftServicePrincipal(appId);
  if (result.completed && result.outputs) {
    const outputs = {
      [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: result.outputs.spId,
      [OUTPUT_KEYS.SAML_SSO_APP_ID]: result.outputs.retrievedAppId,
      [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: result.outputs.appObjectId,
    };
    return {
      ...result,
      outputs: {
        ...outputs,
        producedOutputs: getStepOutputs("M-6").map((o) => ({
          ...o,
          value: outputs[o.key as keyof typeof outputs],
        })),
        inputs: getStepInputs("M-6").map((inp) => ({
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
      inputs: getStepInputs("M-6"),
      expectedOutputs: getStepOutputs("M-6"),
    },
  };
}
