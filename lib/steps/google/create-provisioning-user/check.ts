import { OUTPUT_KEYS } from "@/lib/types";
import { createStepCheck } from "../../utils/check-factory";
import { googleApi } from "@/lib/api/google/index";
import { APIError } from "@/lib/api/utils";
import { handleCheckError } from "../../utils/error-handling";
import { portalUrls } from "@/lib/api/url-builder";

export const checkProvisioningUser = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (context) => {
    if (!context.domain) {
      return { completed: false, message: "Domain not configured." };
    }
    try {
      const email = `azuread-provisioning@${context.domain}`;
      const user = await googleApi.users.get(email, context.logger);
      if (user?.primaryEmail) {
        return {
          completed: true,
          message: `Service account '${email}' exists.`,
          outputs: {
            [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: user.primaryEmail,
            [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: user.id,
            resourceUrl: portalUrls.google.users.details(user.primaryEmail),
          },
        };
      }
      return {
        completed: false,
        message: `Service account '${email}' not found.`,
      };
    } catch (e) {
      if (e instanceof APIError && e.status === 404) {
        return {
          completed: false,
          message: `Service account 'azuread-provisioning@${context.domain}' not found.`,
        };
      }
      return handleCheckError(e, "Couldn't verify service account existence.");
    }
  },
});
