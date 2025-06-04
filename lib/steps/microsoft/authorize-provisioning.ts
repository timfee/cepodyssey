import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { portalUrls } from "@/lib/api/url-builder";
/**
 * Step definition guiding the admin to authorize the Azure provisioning connection.
 */

export const m3AuthorizeProvisioning: StepDefinition = {
  id: "M-3",
  title: "Authorize Azure AD Provisioning to Google Workspace",
  description:
    "Manual step to authorize Azure AD to provision via OAuth. In the Azure portal, open the provisioning app, click 'Authorize', sign in with the Google provisioning user created in G-2, then test the connection.",
  category: "Microsoft",
  automatable: false,
  requires: ["M-2", "G-2"],
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
};
