"use server";

/**
 * Ensure the Azure SAML app has the expected Identifier URI and Reply URL.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftSamlAppSettingsApplied } from "../utils/common-checks";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

export async function checkConfigureSamlApp(
  context: StepContext,
): Promise<StepCheckResult> {
  const appObjectId = context.outputs[
    OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
  ] as string;
  const spEntityId = context.outputs[
    OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
  ] as string;
  const acsUrl = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL] as string;
  if (!appObjectId || !spEntityId || !acsUrl) {
    return {
      completed: false,
      message: "Missing required configuration.",
      outputs: {
        inputs: getStepInputs(STEP_IDS.CONFIGURE_SAML_APP),
        expectedOutputs: getStepOutputs(STEP_IDS.CONFIGURE_SAML_APP),
      },
    };
  }
  const result = await checkMicrosoftSamlAppSettingsApplied(appObjectId, spEntityId, acsUrl);
  return {
    ...result,
    outputs: result.completed
      ? {
          producedOutputs: getStepOutputs(STEP_IDS.CONFIGURE_SAML_APP),
          inputs: getStepInputs(STEP_IDS.CONFIGURE_SAML_APP).map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        }
      : {
          inputs: getStepInputs(STEP_IDS.CONFIGURE_SAML_APP),
          expectedOutputs: getStepOutputs(STEP_IDS.CONFIGURE_SAML_APP),
        },
  };
}
