import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAssignSamlProfile } from "./check";
import { executeAssignSamlProfile } from "./execute";

export const g7AssignSamlProfile: StepDefinition = {
  id: "G-7",
  title: "Assign Google SAML Profile to Users/OUs",
  description:
    "Activate the 'Azure AD SSO' SAML profile for users in Google Workspace. This tool assigns it to the Root OU by default. Adjust in Google Admin console if specific OUs/Groups are required.",
  category: "SSO",
  automatable: true,
  requires: ["G-6"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkAssignSamlProfile,
  execute: executeAssignSamlProfile,
};
