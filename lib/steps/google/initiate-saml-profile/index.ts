import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSamlProfile } from "./check";
import { executeInitiateSamlProfile } from "./execute";

export const g5InitiateSamlProfile: StepDefinition = {
  id: "G-5",
  title: "Initiate Google SAML Profile & Get SP Details",
  description: "Set up single sign-on profile and get connection details",
  category: "Google",
  automatable: true,
  requires: ["G-4"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkSamlProfile,
  execute: executeInitiateSamlProfile,
};
