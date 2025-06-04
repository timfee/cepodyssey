"use server";
import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Add the primary domain to Google Workspace for verification.
 */
export async function executeVerifyDomain(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    if (!context.domain) {
      return {
        success: false,
        error: { message: "Primary domain not available in context.", code: "MISSING_CONFIG" },
      };
    }
    const result = await google.addDomain(token, context.domain);
    if (typeof result === "object" && "alreadyExists" in result) {
      return {
        success: true,
        message: `Domain '${context.domain}' was already added/exists in Google Workspace.`,
        resourceUrl: portalUrls.google.domains.manage(context.domain),
      };
    }
    return {
      success: true,
      message: `Domain '${context.domain}' added. Please ensure it is verified in your Google Workspace Admin console for SAML SSO.`,
      resourceUrl: portalUrls.google.domains.manage(context.domain),
    };
  } catch (e) {
    return handleExecutionError(e, "G-4");
  }
}
