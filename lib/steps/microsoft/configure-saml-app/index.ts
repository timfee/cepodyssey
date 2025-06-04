import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkConfigureSamlApp } from "./check";
import { executeConfigureSamlApp } from "./execute";

export const m7ConfigureSamlApp: StepDefinition = {
  id: "M-7",
  title: "Configure Azure AD SAML App for Google",
  description: "Configure single sign-on settings with Google's details",
  details:
    "Updates the SAML application with Google's ACS URL and entity ID and uploads the Azure AD signing certificate. This finalizes the SAML setup in Microsoft Entra ID.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: "manual",
  automatable: true,

  requires: ["M-6", "G-5"],
  nextStep: { id: "M-8", description: "Retrieve IdP metadata" },
  actions: ["Manual: Enter SAML settings in portal"],
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
  check: checkConfigureSamlApp,
  execute: executeConfigureSamlApp,
};
