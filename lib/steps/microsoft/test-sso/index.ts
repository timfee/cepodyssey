import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkTestSso } from "./check";
import { executeTestSso } from "./execute";

export const m10TestSso = defineStep({
  id: STEP_IDS.TEST_SSO,
  metadata: {
    title: "Test & Validate SSO Sign-in",
    description: "Test signing in with a Microsoft account",
    category: "Microsoft",
    activity: "SSO",
    provider: "Microsoft",
    automatability: "manual",
    requires: [STEP_IDS.ASSIGN_SAML_PROFILE, STEP_IDS.ASSIGN_USERS_SSO],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_ID,
          description: "SSO app ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
    ],
    outputs: [
      { key: OUTPUT_KEYS.FLAG_M10_SSO_TESTED, description: "SSO tested" },
    ],
  },
  urls: {
    configure: portalUrls.azure.myApps(),
    verify: portalUrls.azure.myApps(),
  },
  handlers: { check: checkTestSso, execute: executeTestSso },
});
