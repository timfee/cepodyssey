import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { getGoogleToken } from "../../utils/auth";
import {
  getSamlProfile,
  listSamlProfiles,
  listIdpCredentials,
  type InboundSamlSsoProfile,
} from "@/lib/api/google";
import { portalUrls } from "@/lib/api/url-builder";
import { handleCheckError } from "../../utils/error-handling";

export const checkAssignSamlProfile = createStepCheck({
  requiredOutputs: [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME],
  checkLogic: async (context) => {
    const profileName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    try {
      const token = await getGoogleToken();
      let profile: InboundSamlSsoProfile | null = null;
      if (profileName.startsWith("inboundSamlSsoProfiles/")) {
        profile = await getSamlProfile(
          token,
          profileName,
          context.logger,
        );
      } else {
        const profiles = await listSamlProfiles(token, context.logger);
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
      if (profile.spConfig?.entityId) {
        outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] =
          profile.spConfig.entityId;
      }
      if (profile.spConfig?.assertionConsumerServiceUri) {
        outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL] =
          profile.spConfig.assertionConsumerServiceUri;
      }
      const idpCreds = await listIdpCredentials(
        token,
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
