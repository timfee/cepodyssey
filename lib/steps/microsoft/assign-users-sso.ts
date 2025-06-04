import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { getAzurePortalUrl } from "../../utils";
/**
 * Step definition for assigning users or groups to the Azure SSO application.
 */

export const m9AssignUsersSso: StepDefinition = {
  id: "M-9",
  title: "Assign Users/Groups to Azure AD SSO App",
  description:
    "In Azure AD, assign the relevant users or groups to the Google Workspace SAML SSO application to grant them access to sign in via Azure AD. This tool provides a link to the Azure portal page for manual assignment.",
  category: "SSO",
  automatable: true, // The action provides a link; actual assignment is manual in Azure.
  requires: ["M-6"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("UsersAndGroups", spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("UsersAndGroups", spId as string, appId as string);
    },
  },
};
