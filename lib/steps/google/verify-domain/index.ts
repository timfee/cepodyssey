import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkDomain } from "./check";
import { executeVerifyDomain } from "./execute";

export const g4VerifyDomain: StepDefinition = {
  id: "G-4",
  title: "Add & Verify Domain for Federation",
  description:
    "Ensures the primary domain you intend to federate with Azure AD (as configured in this tool) is added and verified within your Google Workspace account. This is essential for SAML-based Single Sign-On.",
  category: "Google",
  automatable: true,
  requires: [],
  adminUrls: {
    configure: portalUrls.google.domains.manage(),
    verify: portalUrls.google.domains.manage(),
  },
  check: checkDomain,
  execute: executeVerifyDomain,
};
