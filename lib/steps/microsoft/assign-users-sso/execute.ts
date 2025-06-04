"use server";

import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Provide instructions and link for assigning users to the SAML app in Azure.
 */
export async function executeAssignUsers(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const ssoSpObjectId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string | undefined;
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string | undefined;
    if (!ssoSpObjectId || !appId) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${!ssoSpObjectId ? OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID : ''}${!ssoSpObjectId && !appId ? ', ' : ''}${!appId ? OUTPUT_KEYS.SAML_SSO_APP_ID : ''}. Ensure M-6 (Create SAML SSO App) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    return {
      success: true,
      message:
        "Guidance: Assign users/groups to the 'Google Workspace SAML SSO' app in Azure AD via its 'Users and groups' section to grant them SSO access.",
      resourceUrl: portalUrls.azure.enterpriseApp.usersAndGroups(ssoSpObjectId, appId),
    };
  } catch (e) {
    return handleExecutionError(e, "M-9");
  }
}
