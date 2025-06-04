import type { StepDefinition } from "../../types";

/**
 * Step definition for verifying the primary domain used for federation.
 */
export const g4VerifyDomain: StepDefinition = {
  id: "G-4",
  title: "Add & Verify Domain for Federation",
  description:
    "Ensures the primary domain you intend to federate with Azure AD (as configured in this tool) is added and verified within your Google Workspace account. This is essential for SAML-based Single Sign-On.",
  category: "Google",
  automatable: true,
  requires: [],
  adminUrls: {
    configure: "https://admin.google.com/ac/domains/manage",
    verify: "https://admin.google.com/ac/domains/manage",
  },
};
