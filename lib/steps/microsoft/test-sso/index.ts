import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkTestSso } from "./check";
import { executeTestSso } from "./execute";

export const m10TestSso: StepDefinition = {
  id: "M-10",
  title: "Test & Validate SSO Sign-in",
  description: "Test signing in with a Microsoft account",
  details:
    "Tests the entire single sign-on flow using an assigned user account to ensure that authentication works end-to-end. This confirms that both provisioning and SSO have been configured correctly.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: "manual",
  automatable: false,

  requires: ["G-7", "M-9"],
  nextStep: undefined,
  actions: ["Manual: Use 'Test' button in portal"],
  adminUrls: {
    configure: portalUrls.azure.myApps(),
    verify: portalUrls.azure.myApps(),
  },
  check: checkTestSso,
  execute: executeTestSso,
};
