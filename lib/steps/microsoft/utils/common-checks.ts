"use server";
// @ts-nocheck

import {
  microsoftApi,
  getServicePrincipalByAppId,
  getServicePrincipalDetails,
  getApplicationDetails,
  getProvisioningJob,
  listSynchronizationJobs,
  getSynchronizationSchema,
  listAppRoleAssignments,
} from "@/lib/api/microsoft";
import type { ApiLogger } from "@/lib/api/api-logger";
import type { SynchronizationJob } from "@/lib/api/microsoft";
import type { StepCheckResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { APIError } from "@/lib/api/utils";
import { portalUrls } from "@/lib/api/url-builder";
import { handleCheckError } from "../../utils/error-handling";

function createCheckFunction<T, A extends unknown[]>(
  checkName: string,
  checkLogic: (...args: A) => Promise<T>,
  resultMapper: (data: T) => StepCheckResult,
) {
  return async (...args: A): Promise<StepCheckResult> => {
    try {
      const result = await checkLogic(...args);
      return resultMapper(result);
    } catch (e) {
      return handleCheckError(e, `Check failed: ${checkName}`);
    }
  };
}

/**
 * Ensure the Azure service principal for the given app client ID exists.
 * Returns basic identifiers if found.
 */

const checkMicrosoftServicePrincipalInner = createCheckFunction(
  "MicrosoftServicePrincipal",
  async (token: string, appClientId: string) => {
    const sp = await getServicePrincipalByAppId(token, appClientId);
    
    if (sp?.id && sp.appId) {
      let appObjectId: string | undefined;
      const apps = await microsoftApi.applications.list(
        `appId eq '${appClientId}'`,
        logger,
      );
      if (apps[0]?.id) {
        appObjectId = apps[0].id;
      }
      return {
        completed: true,
        message: `Service Principal for App Client ID '${appClientId}' found: ${sp.displayName}.`,
        outputs: {
          spId: sp.id,
          retrievedAppId: sp.appId,
          appObjectId,
          displayName: sp.displayName,
          resourceUrl: portalUrls.azure.enterpriseApp.overview(sp.id, sp.appId),
        },
      } as StepCheckResult;
    }
    return {
      completed: false,
      message: `Service Principal for App Client ID '${appClientId}' not found.`,
    } as StepCheckResult;
  },
  (res) => res,
);

export async function checkMicrosoftServicePrincipal(
  appClientId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  return checkMicrosoftServicePrincipalInner(appClientId, logger);
}

/**
 * Determine if the specified service principal is enabled in Azure AD.
 */

const checkMicrosoftServicePrincipalEnabledInner = createCheckFunction(
  "MicrosoftServicePrincipalEnabled",
  async (token: string, spObjectId: string) => {
    const sp = await getServicePrincipalDetails(token, spObjectId);

    if (sp?.accountEnabled === true) {
      return { completed: true, message: "Service Principal is enabled." } as StepCheckResult;
    }
    return {
      completed: false,
      message: sp
        ? "Service Principal is not enabled."
        : "Service Principal not found. Ensure step M-1 completed successfully.",
    } as StepCheckResult;
  },
  (res) => res,
);

export async function checkMicrosoftServicePrincipalEnabled(
  spObjectId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  return checkMicrosoftServicePrincipalEnabledInner(spObjectId, logger);
}

/**
 * Retrieve provisioning job information for an Azure service principal.
 */

const checkMicrosoftProvisioningJobDetailsInner = createCheckFunction(
  "MicrosoftProvisioningJobDetails",
  async (spObjectId: string, jobId?: string, logger?: ApiLogger) => {
    try {
      let jobToInspect: SynchronizationJob | null = null;
      if (jobId) {
        jobToInspect = await getProvisioningJob(
          token,
          spObjectId,
          jobId,
          logger,
        );
      } else {
        const jobs = await listSynchronizationJobs(token, spObjectId);
        jobToInspect =
          jobs.find((j) => j.templateId === "GoogleApps") ?? jobs[0] ?? null;
      }

      if (jobToInspect?.id) {
        const jobState = jobToInspect.schedule?.state ?? "Unknown";
        const lastExecutionError = jobToInspect.status?.lastExecution?.error;
        let message = `Provisioning job '${jobToInspect.id}' found. State: ${jobState}.`;
        if (lastExecutionError?.message) {
          message += ` Last execution error: ${lastExecutionError.message}`;
        }

        const credentialsLikelyOk = !lastExecutionError?.code
          ?.toLowerCase()
          .includes("invalidcredentials");
        const jobEffectivelyConfigured =
          !!jobToInspect.id && credentialsLikelyOk;

        const outputs = {
          [OUTPUT_KEYS.PROVISIONING_JOB_ID]: jobToInspect.id,
          provisioningJobState: jobState,
        };

        return {
          completed: jobEffectivelyConfigured,
          message,
          outputs,
        } as StepCheckResult;
      }
      return {
        completed: false,
        message:
          "No provisioning job found or configured for this Service Principal.",
      } as StepCheckResult;
    } catch (e) {
      if (
        e instanceof APIError &&
        e.status === 404 &&
        e.message?.includes("No synchronization configuration")
      ) {
        return {
          completed: false,
          message: "Provisioning not configured (no sync job/schema).",
        } as StepCheckResult;
      }
      throw e;
    }
  },
  (res) => res,
);

export async function checkMicrosoftProvisioningJobDetails(
  spObjectId: string,
  jobId?: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  return checkMicrosoftProvisioningJobDetailsInner(spObjectId, jobId, logger);
}

/**
 * Verify the SAML application's identifier URI and reply URL settings.
 */

const checkMicrosoftSamlAppSettingsAppliedInner = createCheckFunction(
  "MicrosoftSamlAppSettingsApplied",
  async (
    appObjectId: string,
    expectedSpEntityId: string,
    expectedAcsUrl: string,
    logger?: ApiLogger,
  ) => {
    const appDetails = await getApplicationDetails(token, appObjectId);

    if (!appDetails) {
      return {
        completed: false,
        message: `Application with Object ID '${appObjectId}' not found.`,
      } as StepCheckResult;
    }

    const hasCorrectIdentifierUri =
      appDetails.identifierUris?.includes(expectedSpEntityId);
    const hasCorrectReplyUrl =
      appDetails.web?.redirectUris?.includes(expectedAcsUrl);

    if (hasCorrectIdentifierUri && hasCorrectReplyUrl) {
      return {
        completed: true,
        message:
          "Azure AD SAML app settings (Entity ID, Reply URL) correctly configured.",
      } as StepCheckResult;
    }
    let message = "Azure AD SAML app settings not fully configured: ";
    if (!hasCorrectIdentifierUri)
      message += `Expected Identifier URI '${expectedSpEntityId}' not found in ${JSON.stringify(
        appDetails.identifierUris,
      )}. `;
    if (!hasCorrectReplyUrl)
      message += `Expected Reply URL '${expectedAcsUrl}' not found in ${JSON.stringify(
        appDetails.web?.redirectUris,
      )}.`;
    return { completed: false, message: message.trim() } as StepCheckResult;
  },
  (res) => res,
);

export async function checkMicrosoftSamlAppSettingsApplied(
  appObjectId: string,
  expectedSpEntityId: string,
  expectedAcsUrl: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  return checkMicrosoftSamlAppSettingsAppliedInner(
    appObjectId,
    expectedSpEntityId,
    expectedAcsUrl,
    logger,
  );
}

/**
 * Check whether key default attribute mappings are present.
 */

const checkMicrosoftAttributeMappingsAppliedInner = createCheckFunction(
  "MicrosoftAttributeMappingsApplied",
  async (spObjectId: string, jobId: string, logger?: ApiLogger) => {
    try {
      const schema = await getSynchronizationSchema(
        token,
        spObjectId,
        jobId,
        logger,
      );
      const userMappingRule = schema?.synchronizationRules?.find((rule) =>
        rule.objectMappings?.some(
          (om) =>
            om.targetObjectName?.toLowerCase() === "user" &&
            om.sourceObjectName?.toLowerCase() === "user",
        ),
      );
      const userObjectMapping = userMappingRule?.objectMappings?.find(
        (om) => om.targetObjectName?.toLowerCase() === "user",
      );

      const hasUserPrincipalNameToUserName =
        userObjectMapping?.attributeMappings?.some(
          (am) =>
            am.targetAttributeName === "userName" &&
            am.source?.expression?.toLowerCase().includes("[userprincipalname]"),
        );
      const hasMailToEmail = userObjectMapping?.attributeMappings?.some(
        (am) =>
          am.targetAttributeName === 'emails[type eq "work"].value' &&
          am.source?.expression?.toLowerCase().includes("[mail]"),
      );


      if (hasUserPrincipalNameToUserName && hasMailToEmail) {
        return {
          completed: true,
          message:
            "Key default attribute mappings (UPN to userName, mail to work email) appear to be configured.",
        } as StepCheckResult;
      }
      return {
        completed: false,
        message:
          "Key default attribute mappings not fully confirmed or schema/job not found.",
      } as StepCheckResult;
    } catch (e) {
      if (e instanceof APIError && e.status === 404) {
        return {
          completed: false,
          message:
            "Synchronization schema or job not found. Mappings cannot be checked.",
        } as StepCheckResult;
      }
      throw e;
    }
  },
  (res) => res,
);

export async function checkMicrosoftAttributeMappingsApplied(
  spObjectId: string,
  jobId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  return checkMicrosoftAttributeMappingsAppliedInner(spObjectId, jobId, logger);
}

/**
 * Determine if any users or groups are assigned to the Azure application.
 */
const checkMicrosoftAppAssignmentsInner = createCheckFunction(
  "MicrosoftAppAssignments",
  async (servicePrincipalObjectId: string, logger?: ApiLogger) => {
    try {
      const assignments = await listAppRoleAssignments(
        token,
        servicePrincipalObjectId,
        logger,
      );
      const hasAssignments = assignments && assignments.length > 0;
      return {
        completed: hasAssignments,
        message: hasAssignments
          ? "Application has user/group assignments."
          : "Application currently has no user/group assignments. Users must be assigned for SSO access.",
      } as StepCheckResult;
    } catch (e) {
      if (e instanceof APIError && e.status === 404) {
        return {
          completed: false,
          message: `Service Principal '${servicePrincipalObjectId}' not found for checking assignments.`,
        } as StepCheckResult;
      }
      throw e;
    }
  },
  (res) => res,
);

export async function checkMicrosoftAppAssignments(
  servicePrincipalObjectId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  return checkMicrosoftAppAssignmentsInner(servicePrincipalObjectId, logger);
}
