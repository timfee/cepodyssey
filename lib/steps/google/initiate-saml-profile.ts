import type { StepDefinition } from "../../types";

/**
 * Step definition for initiating the Google SAML profile and retrieving SP details.
 */
export const g5InitiateSamlProfile: StepDefinition = {
  id: "G-5",
  title: "Initiate Google SAML Profile & Get SP Details",
  description:
    "Creates (or ensures existence of) a SAML SSO profile in Google Workspace for Azure AD, named 'Azure AD SSO'. This step retrieves Google's unique Assertion Consumer Service (ACS) URL and Entity ID, which are required for configuring the SAML application in Azure AD.",
  category: "Google",
  automatable: true,
  requires: ["G-4"],
  adminUrls: {
    configure: "https://admin.google.com/ac/sso",
    verify: "https://admin.google.com/ac/sso",
  },
};
