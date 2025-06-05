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
 * Confirm the SAML profile exists and is fully configured before assignment.
 */
export async function checkAssignSamlProfile(
  context: StepContext,
): Promise<StepCheckResult> {
  const profileName = context.outputs[
    OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
  ] as string;
  if (!profileName) {
    return {
      completed: false,
      message: "SAML profile name not found.",
      outputs: {
        inputs: getStepInputs(STEP_IDS.ASSIGN_SAML_PROFILE),
        expectedOutputs: getStepOutputs(STEP_IDS.ASSIGN_SAML_PROFILE),
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
          inputs: getStepInputs(STEP_IDS.ASSIGN_SAML_PROFILE),
          expectedOutputs: getStepOutputs(STEP_IDS.ASSIGN_SAML_PROFILE),
        },
      };
    }

    const outputs: Record<string, unknown> = {
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
      idpEntityId: profile.idpConfig?.entityId,
      ssoMode: profile.ssoMode,
      resourceUrl: portalUrls.google.sso.samlProfile(profile.name),
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

    return configured
      ? {
          completed: true,
          message: "SAML profile configured.",
          outputs: {
            ...outputs,
            producedOutputs: getStepOutputs(STEP_IDS.ASSIGN_SAML_PROFILE).map(
              (o) => ({
                ...o,
                value: outputs[o.key as keyof typeof outputs],
              }),
            ),
            inputs: getStepInputs(STEP_IDS.ASSIGN_SAML_PROFILE).map((inp) => ({
              ...inp,
              data: { ...inp.data, value: context.outputs[inp.data.key!] },
            })),
          },
        }
      : {
          completed: false,
          message: "SAML profile not yet configured.",
          outputs: {
            inputs: getStepInputs(STEP_IDS.ASSIGN_SAML_PROFILE),
            expectedOutputs: getStepOutputs(STEP_IDS.ASSIGN_SAML_PROFILE),
          },
        };
  } catch (e) {
    return handleCheckError(
      e,
      `Couldn't verify SAML Profile '${profileName}'.`,
    );
  }
}
