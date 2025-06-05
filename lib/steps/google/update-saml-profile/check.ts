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
 * Confirm the Google SAML profile is configured with the expected IdP details.
 */
export async function checkSamlProfileUpdate(
  context: StepContext,
): Promise<StepCheckResult> {
  const profileName = context.outputs[
    OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
  ] as string;
  const expectedIdpEntityId = context.outputs[
    OUTPUT_KEYS.IDP_ENTITY_ID
  ] as string;

  if (!profileName || !expectedIdpEntityId) {
    return {
      completed: false,
      message: "Missing required configuration.",
      outputs: {
        inputs: getStepInputs(STEP_IDS.UPDATE_SAML_PROFILE),
        expectedOutputs: getStepOutputs(STEP_IDS.UPDATE_SAML_PROFILE),
      },
    };
  }

  try {
    const token = await getGoogleToken();
    let profile: google.InboundSamlSsoProfile | null = null;

    if (profileName.startsWith("inboundSamlSsoProfiles/")) {
      profile = await google.getSamlProfile(token, profileName);
    } else {
      const profiles = await google.listSamlProfiles(token);
      profile = profiles.find((p) => p.displayName === profileName) ?? null;
    }

    if (!profile?.name) {
      return {
        completed: false,
        message: `SAML Profile '${profileName}' not found.`,
        outputs: {
          inputs: getStepInputs(STEP_IDS.UPDATE_SAML_PROFILE),
          expectedOutputs: getStepOutputs(STEP_IDS.UPDATE_SAML_PROFILE),
        },
      };
    }

    const resourceUrl = portalUrls.google.sso.samlProfile(profile.name);

    const outputs: Record<string, unknown> = {
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
      idpEntityId: profile.idpConfig?.entityId,
      resourceUrl,
    };

    if (profile.spConfig?.entityId) {
      outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] = profile.spConfig.entityId;
    }
    if (profile.spConfig?.assertionConsumerServiceUri) {
      outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] =
        profile.spConfig.assertionConsumerServiceUri;
    }

    const idpCreds = await google.listIdpCredentials(token, profile.name);
    const configured = !!(
      profile.idpConfig?.entityId &&
      profile.idpConfig?.singleSignOnServiceUri &&
      idpCreds.length > 0
    );

    if (!configured) {
      return {
        completed: false,
        message: `SAML Profile '${profile.displayName}' found but is not fully configured with IdP details or not enabled.`,
        outputs: {
          inputs: getStepInputs(STEP_IDS.UPDATE_SAML_PROFILE),
          expectedOutputs: getStepOutputs(STEP_IDS.UPDATE_SAML_PROFILE),
        },
      };
    }

    if (profile.idpConfig?.entityId !== expectedIdpEntityId) {
      const currentIdp = profile.idpConfig?.entityId ?? "unknown";
      return {
        completed: false,
        message: `SAML Profile '${profile.displayName}' is configured with IdP '${currentIdp}', not the expected '${expectedIdpEntityId}'.`,
        outputs: {
          inputs: getStepInputs(STEP_IDS.UPDATE_SAML_PROFILE),
          expectedOutputs: getStepOutputs(STEP_IDS.UPDATE_SAML_PROFILE),
        },
      };
    }

    return {
      completed: true,
      message: `SAML Profile '${profile.displayName}' is correctly configured with IdP '${expectedIdpEntityId}'.`,
      outputs: {
        ...outputs,
        producedOutputs: getStepOutputs(STEP_IDS.UPDATE_SAML_PROFILE).map((o) => ({
          ...o,
          value: outputs[o.key as keyof typeof outputs],
        })),
        inputs: getStepInputs(STEP_IDS.UPDATE_SAML_PROFILE).map((inp) => ({
          ...inp,
          data: { ...inp.data, value: context.outputs[inp.data.key!] },
        })),
      },
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Couldn't verify SAML Profile '${profileName}'.`,
    );
  }
}
