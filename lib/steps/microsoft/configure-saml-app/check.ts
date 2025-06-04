"use server";

/**
 * Ensure the Azure SAML app has the expected Identifier URI and Reply URL.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftSamlAppSettingsApplied } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

export async function checkConfigureSamlApp(
  context: StepContext,
): Promise<StepCheckResult> {
  const appObjectId = context.outputs[
    OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
  ] as string;
  const spEntityId = context.outputs[
    OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
  ] as string;
  const acsUrl = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] as string;
  if (!appObjectId || !spEntityId || !acsUrl) {
    return {
      completed: false,
      message: "Missing required configuration.",
      outputs: { inputs: getStepInputs("M-7"), expectedOutputs: getStepOutputs("M-7") },
    };
  }
  const result = await checkMicrosoftSamlAppSettingsApplied(appObjectId, spEntityId, acsUrl);
  return {
    ...result,
    outputs: result.completed
      ? {
          producedOutputs: getStepOutputs("M-7"),
          inputs: getStepInputs("M-7").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        }
      : {
          inputs: getStepInputs("M-7"),
          expectedOutputs: getStepOutputs("M-7"),
        },
  };
}
