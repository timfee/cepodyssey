import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkExcludeAutomationOu } from "./check";
import { executeExcludeAutomationOu } from "./execute";

export const g8ExcludeAutomationOu: StepDefinition = {
  id: "G-8",
  title: "Exclude Automation OU from SSO (Optional)",
  description: "Keep sync user using Google sign-in (optional)",
  category: "SSO",
  automatable: true,
  requires: ["G-7"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkExcludeAutomationOu,
  execute: executeExcludeAutomationOu,
};
