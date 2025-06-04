"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../utils/error-handling";

/**
 * Determine if the default "Azure AD SSO" profile exists in Google Workspace.
 * Returns its details if found.
 */
export async function checkSamlProfile(
  _context: StepContext,
): Promise<StepCheckResult> {
  const profileDisplayName = "Azure AD SSO";
  try {
    const token = await getGoogleToken();
    const profiles = await google.listSamlProfiles(token);
    const profile = profiles.find((p) => p.displayName === profileDisplayName);

    if (!profile?.name) {
      return {
        completed: false,
        message: `SAML Profile '${profileDisplayName}' not found.`,
      };
    }

    const outputs: Record<string, unknown> = {
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
      idpEntityId: profile.idpConfig?.entityId,
      resourceUrl: portalUrls.google.sso.samlProfile(profile.name),
    };
    if (profile.spConfig?.entityId) {
      outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] = profile.spConfig.entityId;
    }
    if (profile.spConfig?.assertionConsumerServiceUri) {
      outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] =
        profile.spConfig.assertionConsumerServiceUri;
    }

    return {
      completed: true,
      message: `SAML Profile '${profile.displayName}' exists.`,
      outputs,
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Failed to check SAML Profile '${profileDisplayName}'.`,
    );
  }
}
