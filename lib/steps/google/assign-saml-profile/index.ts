import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkAssignSamlProfile } from "./check";
import { executeAssignSamlProfile } from "./execute";

export const g7AssignSamlProfile = defineStep({
  id: STEP_IDS.ASSIGN_SAML_PROFILE,
  metadata: {
    title: "Assign Google SAML Profile to Users/OUs",
    description: "Turn on single sign-on for your users",
    category: "SSO",
    activity: "SSO",
    provider: "Google",
    automatability: Automatability.AUTOMATED,
    requires: [STEP_IDS.UPDATE_SAML_PROFILE],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
          description: "Full name of the Google SAML profile",
          producedBy: STEP_IDS.INITIATE_SAML_PROFILE,
        },
        stepTitle: "Initiate Google SAML Profile",
      },
    ],
    outputs: [],
  },
  urls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  handlers: { check: checkAssignSamlProfile, execute: executeAssignSamlProfile },
});
