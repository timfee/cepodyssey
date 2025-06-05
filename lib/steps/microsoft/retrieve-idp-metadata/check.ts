"use server";

/**
 * Confirm that IdP metadata values have been stored from Azure AD.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

export async function checkIdpMetadata(
  context: StepContext,
): Promise<StepCheckResult> {
  const hasAll =
    context.outputs[OUTPUT_KEYS.IDP_CERTIFICATE_BASE64] &&
    context.outputs[OUTPUT_KEYS.IDP_SSO_URL] &&
    context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID];
  return hasAll
    ? {
        completed: true,
        message: "Azure AD IdP metadata retrieved.",
        outputs: {
          producedOutputs: getStepOutputs(STEP_IDS.RETRIEVE_IDP_METADATA),
          inputs: getStepInputs(STEP_IDS.RETRIEVE_IDP_METADATA).map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      }
    : {
        completed: false,
        message: "Azure AD IdP metadata not retrieved.",
        outputs: {
          inputs: getStepInputs(STEP_IDS.RETRIEVE_IDP_METADATA),
          expectedOutputs: getStepOutputs(STEP_IDS.RETRIEVE_IDP_METADATA),
        },
      };
}
