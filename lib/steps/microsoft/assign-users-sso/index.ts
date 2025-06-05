import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAssignUsers } from "./check";
import { executeAssignUsers } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { Automatability } from "@/lib/constants/enums";

export const M9_OUTPUTS: StepOutput[] = [];

export const M9_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
      description: "SSO service principal ID",
      producedBy: STEP_IDS.CREATE_SAML_APP,
    },
    stepTitle: "Create SAML App",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.SAML_SSO_APP_ID,
      description: "SSO app ID",
      producedBy: STEP_IDS.CREATE_SAML_APP,
    },
    stepTitle: "Create SAML App",
  },
];

export const m9AssignUsersSso: StepDefinition = {
  id: STEP_IDS.ASSIGN_USERS_SSO,
  title: "Assign Users/Groups to Azure AD SSO App",
  description: "Choose who can use single sign-on",
  details:
    "Assigns users or groups to the SSO application so they can authenticate via Azure AD. Only assigned users will be able to sign in to Google Workspace using SSO.",

  category: "Microsoft",
  activity: "SSO",
  provider: "Microsoft",

  automatability: Automatability.MANUAL,
  automatable: true,

  inputs: M9_INPUTS,
  outputs: M9_OUTPUTS,
  requires: [STEP_IDS.CREATE_SAML_APP],
  nextStep: { id: STEP_IDS.TEST_SSO, description: "Test sign-in" },
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
