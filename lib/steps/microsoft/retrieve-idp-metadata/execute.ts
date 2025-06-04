"use server";

import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../utils/auth";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Retrieve IdP metadata from Azure for configuring Google SAML SSO.
 */
export async function executeRetrieveIdpMetadata(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { tenantId } = await getTokens();
    const samlAppId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string | undefined;
    const spObjectId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string | undefined;

    if (!samlAppId || !spObjectId) {
      return {
        success: false,
        error: {
          message: "Missing required outputs: SAML_SSO_APP_ID or SAML_SSO_SP_OBJECT_ID. Ensure M-7 completed successfully.",
          code: "MISSING_DEPENDENCY",
        },
      };
    }

    const metadata = await microsoft.getSamlMetadata(tenantId, samlAppId);
    return {
      success: true,
      message: "Azure AD IdP SAML metadata (Entity ID, SSO URL, Certificate) retrieved.",
      outputs: {
        [OUTPUT_KEYS.IDP_CERTIFICATE_BASE64]: metadata.certificate,
        [OUTPUT_KEYS.IDP_SSO_URL]: metadata.ssoUrl,
        [OUTPUT_KEYS.IDP_ENTITY_ID]: metadata.entityId,
      },
      resourceUrl: portalUrls.azure.enterpriseApp.singleSignOn(spObjectId, samlAppId),
    };
  } catch (e) {
    return handleExecutionError(e, "M-8");
  }
}
