import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAssignUsers } from "./check";
import { executeAssignUsers } from "./execute";

export const m9AssignUsersSso: StepDefinition = {
  id: "M-9",
  title: "Assign Users/Groups to Azure AD SSO App",
  description: "Choose who can use single sign-on",
  details:
    "Assigns users or groups to the SSO application so they can authenticate via Azure AD. Only assigned users will be able to sign in to Google Workspace using SSO.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: "manual",
  automatable: true,

  requires: ["M-6"],
  nextStep: { id: "M-10", description: "Test sign-in" },
  actions: ["Manual: Add user or group assignments"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.usersAndGroups(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.usersAndGroups(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkAssignUsers,
  execute: executeAssignUsers,
};
