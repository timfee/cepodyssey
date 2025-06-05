import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { AlreadyExistsError } from "@/lib/api/errors";
import { getTokens } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeCreateProvisioningApp = withExecutionHandling({
  stepId: STEP_IDS.CREATE_PROVISIONING_APP,
  requiredOutputs: [],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const { microsoftToken } = await getTokens();
    const TEMPLATE_ID = "8b1025e4-1dd2-430b-a150-2ef79cd700f5";
    const appName = "Google Workspace User Provisioning";

    let result: {
      application: microsoft.Application;
      servicePrincipal: microsoft.ServicePrincipal;
    };
    try {
      result = await microsoft.createEnterpriseApp(
        microsoftToken,
        TEMPLATE_ID,
        appName,
        context.logger,
      );
    } catch (error) {
      if (error instanceof AlreadyExistsError) {
        const existingApps = await microsoft.listApplications(
          microsoftToken,
          `displayName eq '${appName}'`,
          context.logger,
        );
        const existingApp = existingApps[0];
        if (existingApp?.appId) {
          const sp = await microsoft.getServicePrincipalByAppId(
            microsoftToken,
            existingApp.appId,
            context.logger,
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
      throw error;
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
  },
});
