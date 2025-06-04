"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkGoogleSamlProfileDetails } from "@/app/actions/check-actions";
import { OUTPUT_KEYS } from "@/lib/types";

export async function checkExcludeAutomationOu(context: StepContext): Promise<StepCheckResult> {
  // Hard to check automatically; rely on SAML profile status
  const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
  if (!profileName) {
    return { completed: false, message: "Manual verification needed for OU SSO exclusion." };
  }
  return checkGoogleSamlProfileDetails(profileName, false, undefined);
}
