import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAuthorizeProvisioning } from "./check";
import { executeAuthorizeProvisioning } from "./execute";

export const m3AuthorizeProvisioning: StepDefinition = {
  id: "M-3",
  title: "Authorize Azure AD Provisioning to Google Workspace",
  description:
    "Connect Microsoft to Google: Click 'Authorize' in Azure and sign in with the Google sync user",
  details:
    "Manually complete the OAuth consent flow in the Azure portal using the provisioning user. This grants Azure AD permission to manage users and groups in Google Workspace.",

  category: "Microsoft",
  activity: "Provisioning",
  provider: "Microsoft",

  automatability: "manual",
  automatable: false,
  requires: ["M-2", "G-3"],
  nextStep: {
    id: "M-4",
    description: "Configure how user attributes map between systems",
  },

  actions: [
    "Manual: Click 'Authorize' in Azure portal",
    "Manual: Sign in with provisioning user",
    "Manual: Grant consent",
    "Manual: Test connection",
  ],
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
  check: checkAuthorizeProvisioning,
  execute: executeAuthorizeProvisioning,
};
