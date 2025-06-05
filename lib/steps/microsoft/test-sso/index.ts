import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkTestSso } from "./check";
import { executeTestSso } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const M10_OUTPUTS: StepOutput[] = [
  { key: OUTPUT_KEYS.FLAG_M10_SSO_TESTED, description: "SSO tested" },
];

export const M10_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.SAML_SSO_APP_ID,
      description: "SSO app ID",
      producedBy: STEP_IDS.CREATE_SAML_APP,
    },
    stepTitle: "Create SAML App",
  },
];

export const m10TestSso: StepDefinition = {
  id: STEP_IDS.TEST_SSO,
  title: "Test & Validate SSO Sign-in",
  description: "Test signing in with a Microsoft account",
  details:
    "Tests the entire single sign-on flow using an assigned user account to ensure that authentication works end-to-end. This confirms that both provisioning and SSO have been configured correctly.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: "manual",
  automatable: false,

  inputs: M10_INPUTS,
  outputs: M10_OUTPUTS,
  requires: [STEP_IDS.ASSIGN_SAML_PROFILE, STEP_IDS.ASSIGN_USERS_SSO],
  nextStep: undefined,
  actions: ["Manual: Use 'Test' button in portal"],
  adminUrls: {
    configure: portalUrls.azure.myApps(),
    verify: portalUrls.azure.myApps(),
  },
  check: checkTestSso,
  execute: executeTestSso,
};
