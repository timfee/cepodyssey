"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkGoogleSamlProfileDetails } from "@/app/actions/check-actions";
import { OUTPUT_KEYS } from "@/lib/types";

export async function checkAssignSamlProfile(context: StepContext): Promise<StepCheckResult> {
  const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
  if (!profileName) {
    return { completed: false, message: "SAML profile name not found." };
  }
  const result = await checkGoogleSamlProfileDetails(profileName, false, undefined);
  return result.completed ? { completed: true, message: "SAML profile configured." } : { completed: false, message: "SAML profile not yet configured." };
}
