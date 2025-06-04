"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftSamlAppSettingsApplied } from "@/app/actions/check-actions";

export async function checkConfigureSamlApp(context: StepContext): Promise<StepCheckResult> {
  const appObjectId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID] as string;
  const spEntityId = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] as string;
  const acsUrl = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] as string;
  if (!appObjectId || !spEntityId || !acsUrl) {
    return { completed: false, message: "Missing required configuration." };
  }
  return checkMicrosoftSamlAppSettingsApplied(appObjectId, spEntityId, acsUrl);
}
