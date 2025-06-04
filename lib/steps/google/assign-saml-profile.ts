import type { StepDefinition } from "../../types";
import { portalUrls } from "@/lib/api/url-builder";

/**
 * Step definition for assigning the Google SAML profile to users or organizational units.
 */
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
};
