import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAssignUsers } from "./check";
import { executeAssignUsers } from "./execute";

export const m9AssignUsersSso: StepDefinition = {
  id: "M-9",
  title: "Assign Users/Groups to Azure AD SSO App",
  description:
    "In Azure AD, assign the relevant users or groups to the Google Workspace SAML SSO application to grant them access to sign in via Azure AD. This tool provides a link to the Azure portal page for manual assignment.",
  category: "SSO",
  automatable: true,
  requires: ["M-6"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.usersAndGroups(spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.usersAndGroups(spId as string, appId as string);
    },
  },
  check: checkAssignUsers,
  execute: executeAssignUsers,
};
