import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkSamlProfile } from "./check";
import { executeInitiateSamlProfile } from "./execute";

export const g5InitiateSamlProfile = defineStep({
  id: STEP_IDS.INITIATE_SAML_PROFILE,
  metadata: {
    title: "Initiate Google SAML Profile & Get SP Details",
    description: "Set up single sign-on profile and get connection details",
    category: "Google",
    activity: "SSO",
    provider: "Google",
    automatability: Automatability.AUTOMATED,
    requires: [STEP_IDS.VERIFY_DOMAIN],
  },
  io: {
    inputs: [],
    outputs: [
      { key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME, description: "SAML profile name" },
      { key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME, description: "Full resource name of the SAML profile" },
      { key: OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID, description: "Google SP Entity ID" },
      { key: OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL, description: "Google ACS URL" },
    ],
  },
  urls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  handlers: { check: checkSamlProfile, execute: executeInitiateSamlProfile },
});
