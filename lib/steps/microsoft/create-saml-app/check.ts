"use server";

/**
 * Check if the Azure SAML SSO application exists.
 */

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftServicePrincipal } from "../utils/common-checks";

export async function checkCreateSamlApp(context: StepContext): Promise<StepCheckResult> {
  const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
  if (!appId) {
    return { completed: false, message: "SAML SSO App ID not found." };
  }
  const result = await checkMicrosoftServicePrincipal(appId);
  if (result.completed && result.outputs) {
    return {
      ...result,
      outputs: {
        [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: result.outputs.spId,
        [OUTPUT_KEYS.SAML_SSO_APP_ID]: result.outputs.retrievedAppId,
        [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: result.outputs.appObjectId,
      },
    };
  }
  return result;
}
