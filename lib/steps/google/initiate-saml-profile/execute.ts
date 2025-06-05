"use server";

import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Create the initial "Azure AD SSO" SAML profile in Google Workspace.
 */
export async function executeInitiateSamlProfile(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const profileDisplayName = "Azure AD SSO";
    const result = await google.createSamlProfile(token, profileDisplayName);

    if (typeof result === "object" && "alreadyExists" in result) {
      const profiles = await google.listSamlProfiles(token);
      const existingProfile = profiles.find(
        (p) => p.displayName === profileDisplayName,
      );
      if (
        !existingProfile?.name ||
        !existingProfile.spConfig?.entityId ||
        !existingProfile.spConfig?.assertionConsumerServiceUri
      ) {
        return {
          success: false,
          error: {
            message: `SAML Profile '${profileDisplayName}' appears to exist but required details could not be retrieved. Remove any partial profile and rerun this step.`,
            code: "SAML_PROFILE_FETCH_FAILED",
          },
        };
      }
      return {
        success: true,
        message: `SAML Profile '${profileDisplayName}' already exists. Using its details.`,
        resourceUrl: portalUrls.google.sso.samlProfile(existingProfile.name),
        outputs: {
          [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: existingProfile.displayName,
          [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: existingProfile.name,
          [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]:
            existingProfile.spConfig.entityId,
          [OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL]:
            existingProfile.spConfig.assertionConsumerServiceUri,
        },
      };
    }

    if (
      !result.name ||
      !result.spConfig?.entityId ||
      !result.spConfig?.assertionConsumerServiceUri
    ) {
      return {
        success: false,
        error: {
          message:
            "Google did not return the expected SAML profile details after creation. Delete the profile in the Admin Console and rerun this step.",
          code: "SAML_PROFILE_MISSING_DETAILS",
        },
      };
    }

    return {
      success: true,
      message: `SAML Profile '${profileDisplayName}' created in Google Workspace.`,
      resourceUrl: portalUrls.google.sso.samlProfile(result.name),
      outputs: {
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: result.displayName,
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: result.name,
        [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]: result.spConfig.entityId,
        [OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL]:
          result.spConfig.assertionConsumerServiceUri,
      },
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.INITIATE_SAML_PROFILE);
  }
}
