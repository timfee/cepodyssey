"use server";

import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";

/**
 * Instruct the admin to authorize Azure provisioning via OAuth.
 * Returns the portal link to the provisioning settings page.
 */
export async function executeAuthorizeProvisioning(
  context: StepContext,
): Promise<StepExecutionResult> {
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as
    | string
    | undefined;
  const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
    | string
    | undefined;
  const resourceUrl =
    spId && appId
      ? portalUrls.azure.enterpriseApp.provisioning(spId, appId)
      : portalUrls.azure.myApps();

  return {
    success: true,
    message:
      "ACTION REQUIRED: In the Azure portal, open the provisioning app, click 'Authorize', and sign in with the Google provisioning user created in G-2. After testing the connection, mark this step complete.",
    outputs: { [OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]: true },
    resourceUrl,
  };
}
