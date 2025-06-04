import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkTestSso } from "./check";
import { executeTestSso } from "./execute";

export const m10TestSso: StepDefinition = {
  id: "M-10",
  title: "Test & Validate SSO Sign-in",
  description: "Test signing in with a Microsoft account",
  category: "SSO",
  automatable: false,
  requires: ["G-7", "M-9"],
  adminUrls: {
    configure: portalUrls.azure.myApps(),
    verify: portalUrls.azure.myApps(),
  },
  check: checkTestSso,
  execute: executeTestSso,
};
