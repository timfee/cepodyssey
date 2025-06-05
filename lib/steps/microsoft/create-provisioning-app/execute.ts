"use server";

import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Create the Azure Enterprise application used for user provisioning.
 */
export async function executeCreateProvisioningApp(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const TEMPLATE_ID = "8b1025e4-1dd2-430b-a150-2ef79cd700f5";
    const appName = "Google Workspace User Provisioning";

    const result = await microsoft.createEnterpriseApp(
      microsoftToken,
      TEMPLATE_ID,
      appName,
    );
    if (typeof result === "object" && "alreadyExists" in result) {
      const existingApps = await microsoft.listApplications(
        microsoftToken,
        `displayName eq '${appName}'`,
      );
      const existingApp = existingApps[0];
      if (existingApp?.appId) {
        const sp = await microsoft.getServicePrincipalByAppId(
          microsoftToken,
          existingApp.appId,
        );
        if (existingApp.id && sp?.id) {
          return {
            success: true,
            message: `Enterprise app '${appName}' for provisioning already exists.`,
            resourceUrl: portalUrls.azure.enterpriseApp.overview(
              sp.id as string,
              existingApp.appId as string,
            ),
            outputs: {
              [OUTPUT_KEYS.PROVISIONING_APP_ID]: existingApp.appId,
              [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: existingApp.id,
              [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: sp.id,
            },
          };
        }
      }
      return {
        success: true,
        message: `Enterprise app '${appName}' already exists, but could not retrieve its full details.`,
      };
    }
    return {
      success: true,
      message: `Enterprise app '${appName}' created.`,
      resourceUrl: portalUrls.azure.enterpriseApp.overview(
        result.servicePrincipal.id as string,
        result.application.appId as string,
      ),
      outputs: {
        [OUTPUT_KEYS.PROVISIONING_APP_ID]: result.application.appId,
        [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: result.application.id,
        [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: result.servicePrincipal.id,
      },
    };
  } catch (e) {
    return handleExecutionError(e, STEP_IDS.CREATE_PROVISIONING_APP);
  }
}
