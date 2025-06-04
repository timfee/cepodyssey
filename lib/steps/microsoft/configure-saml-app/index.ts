import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkConfigureSamlApp } from "./check";
import { executeConfigureSamlApp } from "./execute";

export const m7ConfigureSamlApp: StepDefinition = {
  id: "M-7",
  title: "Configure Azure AD SAML App for Google",
  description: "Configure single sign-on settings with Google's details",
  category: "SSO",
  automatable: true,
  requires: ["M-6", "G-5"],
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
