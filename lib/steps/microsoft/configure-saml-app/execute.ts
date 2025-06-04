"use server";

import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../utils/auth";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Configure Identifier URI and Reply URL settings on the Azure SAML app.
 */
export async function executeConfigureSamlApp(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const validation = [
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
      OUTPUT_KEYS.SAML_SSO_APP_ID,
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
      OUTPUT_KEYS.GOOGLE_SAML_ACS_URL,
    ].filter((k) => !context.outputs[k]);
    if (validation.length > 0 || !context.domain) {
      const missing = [...validation];
      if (!context.domain) missing.push("domain");
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${missing.join(", ")}. Ensure M-6 (Create SAML SSO App) and G-5 completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const appObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
    ] as string;
    const spObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    const googleSpEntityId = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
    ] as string;
    const googleAcsUrl = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_ACS_URL
    ] as string;
    const primaryDomain = context.domain as string;

    const appPatchPayload: Partial<microsoft.Application> = {
      identifierUris: [googleSpEntityId, `https://${primaryDomain}`],
      web: {
        redirectUris: [googleAcsUrl],
        implicitGrantSettings: {
          enableIdTokenIssuance: false,
          enableAccessTokenIssuance: false,
        },
      },
    };

    await microsoft.updateApplication(
      microsoftToken,
      appObjectId,
      appPatchPayload,
    );

    return {
      success: true,
      message:
        "Azure AD SAML app (Identifier URIs, Reply URL) configured. Verify 'User Attributes & Claims' (NameID should be UPN) manually in Azure Portal.",
      outputs: { [OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.singleSignOn(spObjectId, appId),
    };
  } catch (e) {
    return handleExecutionError(e, "M-7");
  }
}
