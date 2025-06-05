import { createStepCheck } from "../../utils/check-factory";
import { googleApi } from "@/lib/api/google";
import { handleCheckError } from "../../utils/error-handling";
import { APIError } from "@/lib/api/utils";
import { HTTP_STATUS_NOT_FOUND } from "@/lib/constants/http-status";

export const checkDomain = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (context) => {
    if (!context.domain) {
      return { completed: false, message: "Domain not configured." };
    }
    try {
      const domainDetails = await googleApi.domains.get(
        context.domain,
        undefined,
        context.logger,
      );
      const isVerified = !!(
        typeof domainDetails === "object" &&
        domainDetails &&
        "verified" in domainDetails &&
        domainDetails.verified
      );
      return {
        completed: isVerified,
        message: isVerified
          ? `Domain '${context.domain}' is verified.`
          : `Domain '${context.domain}' is not verified or not found. Verification is required for SAML SSO.`,
      };
    } catch (e) {
      if (e instanceof APIError && e.status === HTTP_STATUS_NOT_FOUND) {
        return {
          completed: false,
          message: `Domain '${context.domain}' not found in Google Workspace.`,
        };
      }
      return handleCheckError(
        e,
        `Couldn't verify domain verification for '${context.domain}'.`,
      );
    }
  },
});
