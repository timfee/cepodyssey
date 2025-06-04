import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkIdpMetadata } from "./check";
import { executeRetrieveIdpMetadata } from "./execute";

export const m8RetrieveIdpMetadata: StepDefinition = {
  id: "M-8",
  title: "Retrieve Azure AD IdP SAML Metadata for Google",
  description: "Get Microsoft's sign-on details for Google",
  category: "SSO",
  automatable: true,
  requires: ["M-7"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkIdpMetadata,
  execute: executeRetrieveIdpMetadata,
};
