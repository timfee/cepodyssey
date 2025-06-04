"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkMicrosoftServicePrincipal } from "../utils/common-checks";

/**
 * Verify the provisioning enterprise application exists in Azure AD.
 */
export async function checkProvisioningApp(
  context: StepContext,
): Promise<StepCheckResult> {
  const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
  if (!appId) {
    return { completed: false, message: "Provisioning App ID not found." };
  }
  const result = await checkMicrosoftServicePrincipal(appId);
  if (result.completed && result.outputs) {
    return {
      ...result,
      outputs: {
        [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: result.outputs.spId,
        [OUTPUT_KEYS.PROVISIONING_APP_ID]: result.outputs.retrievedAppId,
        [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: result.outputs.appObjectId,
      },
    };
  }
  return result;
}
