import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { googleApi } from "@/lib/api/google";
import { portalUrls } from "@/lib/api/url-builder";
import { handleCheckError } from "../../utils/error-handling";

export const checkSamlProfile = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (_context) => {
    const profileDisplayName = "Azure AD SSO";
    try {
      const profiles = await googleApi.saml.listProfiles();
      const profile = profiles.find(
        (p) => p.displayName === profileDisplayName,
      );
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
        outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] =
          profile.spConfig.entityId;
      }
      if (profile.spConfig?.assertionConsumerServiceUri) {
        outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL] =
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
        `Couldn't verify SAML Profile '${profileDisplayName}'.`,
      );
    }
  },
});
