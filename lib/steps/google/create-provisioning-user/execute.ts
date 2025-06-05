"use server";

import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { validateRequiredOutputs } from "../../utils/validation";

/**
 * Create the `azuread-provisioning` user inside the Automation OU.
 */
export async function executeCreateProvisioningUser(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const validation = validateRequiredOutputs(
      context,
      [OUTPUT_KEYS.AUTOMATION_OU_PATH],
      STEP_IDS.CREATE_AUTOMATION_OU,
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const token = await getGoogleToken();
    const domain = context.domain;
    const ouPath = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string;

    const email = `azuread-provisioning@${domain}`;
    const tempPassword = `P@${Date.now()}w0rd`;
    const user: google.DirectoryUser = {
      primaryEmail: email,
      name: { givenName: "Microsoft Entra ID", familyName: "Provisioning" },
      password: tempPassword,
      orgUnitPath: ouPath,
      changePasswordAtNextLogin: false,
    };

    const result = await google.createUser(token, user);
    if (typeof result === "object" && "alreadyExists" in result) {
      const existing = await google.getUser(token, email);
      if (existing?.primaryEmail && existing.id) {
        return {
          success: true,
          message: `User '${email}' already exists.`,
          outputs: {
            [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: existing.primaryEmail,
            [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: existing.id,
          },
          resourceUrl: portalUrls.google.users.details(existing.primaryEmail),
        };
      }
      return { success: true, message: `User '${email}' already exists.` };
    }

    if (!result.id || !result.primaryEmail) {
      return {
        success: false,
        error: {
          message: "Failed to create provisioning user.",
          code: "API_ERROR",
        },
      };
    }

    return {
      success: true,
      message: `User '${email}' created in OU '${ouPath}'.`,
      outputs: {
        [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: result.primaryEmail,
        [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: result.id,
      },
      resourceUrl: portalUrls.google.users.details(result.primaryEmail),
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.CREATE_PROVISIONING_USER);
  }
}
