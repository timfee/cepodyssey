"use server";

import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../utils/error-handling";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

/**
 * Verify the SAML profile is configured; used as a proxy check for OU exclusion.
 */
export async function checkExcludeAutomationOu(
  context: StepContext,
): Promise<StepCheckResult> {
  const profileName = context.outputs[
    OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
  ] as string;
  if (!profileName) {
    return {
      completed: false,
      message: "Manual verification needed for OU SSO exclusion.",
      outputs: {
        inputs: getStepInputs("G-8"),
        expectedOutputs: getStepOutputs("G-8"),
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
          inputs: getStepInputs("G-8"),
          expectedOutputs: getStepOutputs("G-8"),
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
            producedOutputs: getStepOutputs("G-8").map((o) => ({
              ...o,
              value: outputs[o.key as keyof typeof outputs],
            })),
            inputs: getStepInputs("G-8").map((inp) => ({
              ...inp,
              data: { ...inp.data, value: context.outputs[inp.data.key!] },
            })),
          },
        }
      : {
          completed: false,
          message: "SAML profile not yet configured.",
          outputs: {
            inputs: getStepInputs("G-8"),
            expectedOutputs: getStepOutputs("G-8"),
          },
        };
  } catch (e) {
    return handleCheckError(
      e,
      `Couldn't verify SAML Profile '${profileName}'.`,
    );
  }
}
