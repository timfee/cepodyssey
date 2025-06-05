import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { AlreadyExistsError } from "@/lib/api/errors";
import { getGoogleToken } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeInitiateSamlProfile = withExecutionHandling({
  stepId: STEP_IDS.INITIATE_SAML_PROFILE,
  requiredOutputs: [],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const profileDisplayName = "Azure AD SSO";

    let result;
    try {
      result = await google.createSamlProfile(
        token,
        profileDisplayName,
        context.logger,
      );
    } catch (error) {
      if (error instanceof AlreadyExistsError) {
        const profiles = await google.listSamlProfiles(token, context.logger);
        const existing = profiles.find(
          (p) => p.displayName === profileDisplayName,
        );
        if (existing?.name) {
          return {
            success: true,
            message: `SAML Profile '${profileDisplayName}' already exists.`,
            outputs: {
              [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: existing.displayName,
              [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: existing.name,
            },
            resourceUrl: portalUrls.google.sso.samlProfile(existing.name!),
          };
        }
        return {
          success: true,
          message: `SAML Profile '${profileDisplayName}' already exists.`,
        };
      }
      throw error;
    }

    return {
      success: true,
      message: `SAML Profile '${profileDisplayName}' created.`,
      outputs: {
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: result.displayName,
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: result.name,
      },
      resourceUrl: portalUrls.google.sso.samlProfile(result.name!),
    };
  },
});
