import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkDomain } from "./check";
import { executeVerifyDomain } from "./execute";

export const g4VerifyDomain: StepDefinition = {
  id: "G-4",
  title: "Add & Verify Domain for Federation",
  description: "Verify your domain is ready for single sign-on",
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
