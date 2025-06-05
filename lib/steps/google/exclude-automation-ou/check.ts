import { OUTPUT_KEYS } from "@/lib/types";
import { googleApi } from "@/lib/api/google/index";
import type { InboundSamlSsoProfile } from "@/lib/api/google";
import { portalUrls } from "@/lib/api/url-builder";
import { createStepCheck } from "../../utils/check-factory";
import { handleCheckError } from "../../utils/error-handling";
import { getRequiredOutput } from "../../utils/get-output";

export const checkExcludeAutomationOu = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME],
  checkLogic: async (context) => {
    const profileName = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    );
    try {
      let profile: InboundSamlSsoProfile | null = null;
      if (profileName.startsWith("inboundSamlSsoProfiles/")) {
        profile = await googleApi.saml.getProfile(
          profileName,
          context.logger,
        );
      } else {
        const profiles = await googleApi.saml.listProfiles(context.logger);
        profile = profiles.find((p) => p.displayName === profileName) ?? null;
      }
      if (!profile?.name) {
        return {
          completed: false,
          message: `SAML Profile '${profileName}' not found.`,
        };
      }
      const outputs: Record<string, unknown> = {
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
        idpEntityId: profile.idpConfig?.entityId,
        ssoMode: profile.ssoMode,
        resourceUrl: portalUrls.google.sso.samlProfile(profile.name),
      };
      const idpCreds = await googleApi.saml.listIdpCredentials(
        profile.name,
        context.logger,
      );
      const configured = !!(
        profile.idpConfig?.entityId &&
        profile.idpConfig?.singleSignOnServiceUri &&
        idpCreds.length > 0
      );
      return configured
        ? { completed: true, message: "SAML profile configured.", outputs }
        : { completed: false, message: "SAML profile not yet configured." };
    } catch (e) {
      return handleCheckError(
        e,
        `Couldn't verify SAML Profile '${profileName}'.`,
      );
    }
  },
});
