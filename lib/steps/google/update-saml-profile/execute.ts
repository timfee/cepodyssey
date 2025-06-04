"use server";

import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";

/**
 * Update the Google SAML profile with Azure AD IdP metadata.
 */
export async function executeUpdateSamlProfile(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const validation = [
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
      OUTPUT_KEYS.IDP_ENTITY_ID,
      OUTPUT_KEYS.IDP_SSO_URL,
      OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
    ].filter((key) => !context.outputs[key]);

    if (validation.length > 0) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.join(", ")}. Ensure M-8 (Retrieve Azure Idp Metadata) and G-5 completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }

    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
    const ssoUrl = context.outputs[OUTPUT_KEYS.IDP_SSO_URL] as string;
    const certificate = context.outputs[
      OUTPUT_KEYS.IDP_CERTIFICATE_BASE64
    ] as string;

    await google.updateSamlProfile(token, profileFullName, {
      idpConfig: {
        entityId: idpEntityId,
        singleSignOnServiceUri: ssoUrl,
      },
    });

    await google.addIdpCredentials(token, profileFullName, certificate);

    return {
      success: true,
      message: "Google SAML Profile updated with Azure AD IdP information.",
      resourceUrl: portalUrls.google.sso.main(),
    };
  } catch (e) {
    return handleExecutionError(e, "G-6");
  }
}
