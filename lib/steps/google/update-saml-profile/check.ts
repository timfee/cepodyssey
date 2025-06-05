import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import {
  getSamlProfile,
  listSamlProfiles,
  listIdpCredentials,
  type InboundSamlSsoProfile,
} from "@/lib/api/google";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../../utils/auth";
import { handleCheckError } from "../../utils/error-handling";

export const checkSamlProfileUpdate = createStepCheck({
  requiredOutputs: [
    OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    OUTPUT_KEYS.IDP_ENTITY_ID,
  ],
  checkLogic: async (context) => {
    const profileName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    const expectedIdpEntityId = context.outputs[
      OUTPUT_KEYS.IDP_ENTITY_ID
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
      const resourceUrl = portalUrls.google.sso.samlProfile(profile.name);
      const outputs: Record<string, unknown> = {
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
        idpEntityId: profile.idpConfig?.entityId,
        resourceUrl,
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
      if (!configured) {
        return {
          completed: false,
          message: `SAML Profile '${profile.displayName}' found but is not fully configured with IdP details or not enabled.`,
        };
      }
      if (profile.idpConfig?.entityId !== expectedIdpEntityId) {
        const currentIdp = profile.idpConfig?.entityId ?? "unknown";
        return {
          completed: false,
          message: `SAML Profile '${profile.displayName}' is configured with IdP '${currentIdp}', not the expected '${expectedIdpEntityId}'.`,
        };
      }
      return {
        completed: true,
        message: `SAML Profile '${profile.displayName}' is correctly configured with IdP '${expectedIdpEntityId}'.`,
        outputs,
      };
    } catch (e) {
      return handleCheckError(
        e,
        `Couldn't verify SAML Profile '${profileName}'.`,
      );
    }
  },
});
