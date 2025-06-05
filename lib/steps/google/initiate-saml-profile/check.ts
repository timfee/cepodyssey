"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../../utils/error-handling";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

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
        outputs: {
          inputs: getStepInputs(STEP_IDS.INITIATE_SAML_PROFILE),
          expectedOutputs: getStepOutputs(STEP_IDS.INITIATE_SAML_PROFILE),
        },
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
      outputs: {
        ...outputs,
        producedOutputs: getStepOutputs(STEP_IDS.INITIATE_SAML_PROFILE).map(
          (o) => ({
            ...o,
            value: outputs[o.key as keyof typeof outputs],
          }),
        ),
      },
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Couldn't verify SAML Profile '${profileDisplayName}'.`,
    );
  }
}
