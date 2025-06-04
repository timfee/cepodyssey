import type { StepDefinition } from "../../types";

/**
 * Step definition for optionally excluding the Automation OU from SSO.
 */
export const g8ExcludeAutomationOu: StepDefinition = {
  id: "G-8",
  title: "Exclude Automation OU from SSO (Optional)",
  description:
    "If an 'Automation' OU exists (from manual creation), ensures SAML SSO is explicitly disabled for that OU. This allows any accounts within it to log in directly with Google credentials, bypassing Azure AD SSO.",
  category: "SSO",
  automatable: true,
  requires: ["G-7"],
  adminUrls: {
    configure: "https://admin.google.com/ac/sso",
    verify: "https://admin.google.com/ac/sso",
  },
};
