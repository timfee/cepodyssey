"use server";

/**
 * Confirm that IdP metadata values have been stored from Azure AD.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

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
          producedOutputs: getStepOutputs("M-8"),
          inputs: getStepInputs("M-8").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      }
    : {
        completed: false,
        message: "Azure AD IdP metadata not retrieved.",
        outputs: { inputs: getStepInputs("M-8"), expectedOutputs: getStepOutputs("M-8") },
      };
}
