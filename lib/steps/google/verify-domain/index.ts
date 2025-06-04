import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkDomain } from "./check";
import { executeVerifyDomain } from "./execute";

export const g4VerifyDomain: StepDefinition = {
  id: "G-4",
  title: "Add & Verify Domain for Federation",
  description: "Verify your domain is ready for single sign-on",
  details:
    "Adds your primary domain to Google Workspace and verifies ownership via DNS. This step ensures that federation and provisioning operate on a verified domain.",

  category: "Google",
  activity: "Foundation",
  provider: "Google",

  automatability: "supervised",
  automatable: true,

  requires: [],
  nextStep: { id: "G-5", description: "Create the SAML SSO profile" },

  actions: ["POST /admin/directory/v1/customer/{customerId}/domains"],
  adminUrls: {
    configure: portalUrls.google.domains.manage(),
    verify: portalUrls.google.domains.manage(),
  },
  check: checkDomain,
  execute: executeVerifyDomain,
};
