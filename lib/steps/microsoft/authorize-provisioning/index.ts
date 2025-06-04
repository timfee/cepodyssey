import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAuthorizeProvisioning } from "./check";
import { executeAuthorizeProvisioning } from "./execute";

export const m3AuthorizeProvisioning: StepDefinition = {
  id: "M-3",
  title: "Authorize Azure AD Provisioning to Google Workspace",
  description:
    "Manual step to authorize Azure AD to provision via OAuth. In the Azure portal, open the provisioning app, navigate to Provisioning settings, click 'Authorize', and sign in with the Google provisioning user created in G-2. After successful authorization, test the connection to ensure it works.",
  category: "Microsoft",
  automatable: false,
  requires: ["M-2", "G-3"],
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
