import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkIdpMetadata } from "./check";
import { executeRetrieveIdpMetadata } from "./execute";

export const m8RetrieveIdpMetadata: StepDefinition = {
  id: "M-8",
  title: "Retrieve Azure AD IdP SAML Metadata for Google",
  description: "Get Microsoft's sign-on details for Google",
  details:
    "Retrieves the Azure AD SAML metadata XML which includes the IdP entity ID, sign-in URL, and certificate. Google Workspace uses this data to trust Azure AD as the identity provider.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: "automated",
  automatable: true,

  requires: ["M-7"],
  nextStep: { id: "M-9", description: "Assign users to SSO app" },
  actions: ["GET /federationmetadata/2007-06/federationmetadata.xml"],
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
