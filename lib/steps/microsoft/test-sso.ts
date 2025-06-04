import type { StepDefinition } from "../../types";
import { portalUrls } from "@/lib/api/url-builder";

/**
 * Step definition for manual testing of the complete SSO flow.
 */
export const m10TestSso: StepDefinition = {
  id: "M-10",
  title: "Test & Validate SSO Sign-in",
  description:
    "Manual: Test the complete SAML SSO flow by attempting to log into a Google service with an Azure AD user account that has been provisioned (if applicable) and assigned to the SSO app in Azure AD.",
  category: "SSO",
  automatable: false,
  requires: ["G-7", "M-9"],
  adminUrls: {
    configure: portalUrls.azure.myApps(),
    verify: portalUrls.azure.myApps(),
  },
};
