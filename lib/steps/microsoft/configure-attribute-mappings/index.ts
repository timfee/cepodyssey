import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAttributeMappings } from "./check";
import { executeConfigureAttributeMappings } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { Automatability } from "@/lib/constants/enums";

export const M4_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED,
    description: "Attribute mappings configured",
  },
];

export const M4_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      description: "Service principal object ID",
      producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
    },
    stepTitle: "Create Provisioning App",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_JOB_ID,
      description: "Provisioning job ID",
      producedBy: STEP_IDS.AUTHORIZE_PROVISIONING,
    },
    stepTitle: "Authorize Provisioning",
  },
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_APP_ID,
      description: "Provisioning app ID",
      producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
    },
    stepTitle: "Create Provisioning App",
  },
];

export const m4ConfigureAttributeMappings: StepDefinition = {
  id: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
  title: "Configure Attribute Mappings (Provisioning)",
  description: "Set up how user data syncs between systems",
  details:
    "Defines how Azure AD attributes map to Google Workspace fields. Proper mappings ensure user information like names and group membership sync correctly.",

  category: "Microsoft",
  activity: "Provisioning",
  provider: "Microsoft",

  automatability: Automatability.MANUAL,
  automatable: true,
  inputs: M4_INPUTS,
  outputs: M4_OUTPUTS,
  requires: [STEP_IDS.AUTHORIZE_PROVISIONING],
  nextStep: {
    id: STEP_IDS.START_PROVISIONING,
    description: "Start synchronization job",
  },
  actions: ["Manual: Edit attribute mappings in portal"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkAttributeMappings,
  execute: executeConfigureAttributeMappings,
};
