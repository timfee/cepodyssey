import { createStepCheck } from "../../utils/check-factory";
import { getDomain } from "@/lib/api/google";
import { getGoogleToken } from "../../utils/auth";
import { handleCheckError } from "../../utils/error-handling";
import { APIError } from "@/lib/api/utils";

export const checkDomain = createStepCheck({
  requiredOutputs: [],
  checkLogic: async (context) => {
    if (!context.domain) {
      return { completed: false, message: "Domain not configured." };
    }
    try {
      const token = await getGoogleToken();
      const domainDetails = await getDomain(
        token,
        context.domain,
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
      if (e instanceof APIError && e.status === 404) {
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
