"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkGoogleSamlProfileDetails } from "@/app/actions/check-actions";
import { OUTPUT_KEYS } from "@/lib/types";

export async function checkSamlProfileUpdate(context: StepContext): Promise<StepCheckResult> {
  const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
  const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
  if (!profileName || !idpEntityId) {
    return { completed: false, message: "Missing required configuration." };
  }
  return checkGoogleSamlProfileDetails(profileName, false, idpEntityId);
}
