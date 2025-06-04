import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSamlProfileUpdate } from "./check";
import { executeUpdateSamlProfile } from "./execute";

export const g6UpdateSamlProfile: StepDefinition = {
  id: "G-6",
  title: "Update Google SAML Profile with Azure AD IdP Info",
  description: "Connect Google to Microsoft using sign-on details",
  category: "SSO",
  automatable: true,
  requires: ["G-5", "M-8"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkSamlProfileUpdate,
  execute: executeUpdateSamlProfile,
};
