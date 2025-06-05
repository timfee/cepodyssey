import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkExcludeAutomationOu } from "./check";
import { executeExcludeAutomationOu } from "./execute";

export const g8ExcludeAutomationOu = defineStep({
  id: STEP_IDS.EXCLUDE_AUTOMATION_OU,
  metadata: {
    title: "Exclude Automation OU from SSO (Optional)",
    description: "Keep sync user using Google sign-in (optional)",
    category: "SSO",
    activity: "SSO",
    provider: "Google",
    automatability: "supervised",
    requires: [STEP_IDS.ASSIGN_SAML_PROFILE],
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
  handlers: { check: checkExcludeAutomationOu, execute: executeExcludeAutomationOu },
});
