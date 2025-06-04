import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { portalUrls } from "@/lib/api/url-builder";
/**
 * Step definition for creating the enterprise application used for provisioning.
 */

export const m1CreateProvisioningApp: StepDefinition = {
  id: "M-1",
  title: "Create Azure AD Enterprise App for Provisioning",
  description:
    "Adds the 'Google Cloud / G Suite Connector by Microsoft' gallery application in Azure AD. This specific app instance will be dedicated to managing user provisioning from Azure AD to Google Workspace.",
  category: "Microsoft",
  automatable: true,
  requires: [],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
  },
};
