import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkIdpMetadata } from "./check";
import { executeRetrieveIdpMetadata } from "./execute";

export const m8RetrieveIdpMetadata: StepDefinition = {
  id: "M-8",
  title: "Retrieve Azure AD IdP SAML Metadata for Google",
  description:
    "From the configured Azure AD SAML app, obtains its SAML Signing Certificate (Base64 encoded), Login URL (SSO Service URL), and Azure AD Identifier (IdP Entity ID). These are needed to complete SAML setup in Google Workspace.",
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
