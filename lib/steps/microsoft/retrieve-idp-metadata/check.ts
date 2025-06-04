"use server";

/**
 * Confirm that IdP metadata values have been stored from Azure AD.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";

export async function checkIdpMetadata(
  context: StepContext,
): Promise<StepCheckResult> {
  return context.outputs[OUTPUT_KEYS.IDP_CERTIFICATE_BASE64] &&
    context.outputs[OUTPUT_KEYS.IDP_SSO_URL] &&
    context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID]
    ? { completed: true, message: "Azure AD IdP metadata retrieved." }
    : { completed: false, message: "Azure AD IdP metadata not retrieved." };
}
