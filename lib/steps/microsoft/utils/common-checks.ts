"use server";

import { microsoftApi } from "@/lib/api/microsoft";
import { portalUrls } from "@/lib/api/url-builder";
import type { ApiLogger } from "@/lib/api/api-logger";
import type { SynchronizationJob } from "@/lib/api/microsoft";
import type { StepCheckResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { APIError } from "@/lib/api/utils";

/**
 * Ensure the Azure service principal for the given app client ID exists.
 * Returns basic identifiers if found.
 */

export async function checkMicrosoftServicePrincipal(
  appClientId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  const sp = await microsoftApi.servicePrincipals.getByAppId(appClientId, logger);

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
}

/**
 * Determine if the specified service principal is enabled in Azure AD.
 */

export async function checkMicrosoftServicePrincipalEnabled(
  spObjectId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  const sp = await microsoftApi.servicePrincipals.get(spObjectId, logger);

  if (sp?.accountEnabled === true) {
    return { completed: true, message: "Service Principal is enabled." };
  }
  return {
    completed: false,
    message: sp
      ? "Service Principal is not enabled."
      : "Service Principal not found. Ensure step M-1 completed successfully.",
  };
}

/**
 * Retrieve provisioning job information for an Azure service principal.
 */

export async function checkMicrosoftProvisioningJobDetails(
  spObjectId: string,
  jobId?: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  try {
    let jobToInspect: SynchronizationJob | null = null;
    if (jobId) {
      jobToInspect = await microsoftApi.provisioning.getJob(
        spObjectId,
        jobId,
        logger,
      );
    } else {
      const jobs = await microsoftApi.provisioning.listJobs(spObjectId, logger);
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
      };
    }
    return {
      completed: false,
      message:
        "No provisioning job found or configured for this Service Principal.",
    };
  } catch (e) {
    if (
      e instanceof APIError &&
      e.status === 404 &&
      e.message?.includes("No synchronization configuration")
    ) {
      return {
        completed: false,
        message: "Provisioning not configured (no sync job/schema).",
      };
    }
    throw e;
  }
}

/**
 * Verify the SAML application's identifier URI and reply URL settings.
 */

export async function checkMicrosoftSamlAppSettingsApplied(
  appObjectId: string,
  expectedSpEntityId: string,
  expectedAcsUrl: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  const appDetails = await microsoftApi.applications.get(appObjectId, logger);

  if (!appDetails) {
    return {
      completed: false,
      message: `Application with Object ID '${appObjectId}' not found.`,
    };
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
    };
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
  return { completed: false, message: message.trim() };
}

/**
 * Check whether key default attribute mappings are present.
 */

export async function checkMicrosoftAttributeMappingsApplied(
  spObjectId: string,
  jobId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  try {
    const schema = await microsoftApi.provisioning.getSchema(
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
      };
    }
    return {
      completed: false,
      message:
        "Key default attribute mappings not fully confirmed or schema/job not found.",
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message:
          "Synchronization schema or job not found. Mappings cannot be checked.",
      };
    }
    throw e;
  }
}

/**
 * Determine if any users or groups are assigned to the Azure application.
 */
export async function checkMicrosoftAppAssignments(
  servicePrincipalObjectId: string,
  logger?: ApiLogger,
): Promise<StepCheckResult> {
  try {
    const assignments = await microsoftApi.servicePrincipals.listAssignments(
      servicePrincipalObjectId,
      logger,
    );
    const hasAssignments = assignments && assignments.length > 0;
    return {
      completed: hasAssignments,
      message: hasAssignments
        ? "Application has user/group assignments."
        : "Application currently has no user/group assignments. Users must be assigned for SSO access.",
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Service Principal '${servicePrincipalObjectId}' not found for checking assignments.`,
      };
    }
    throw e;
  }
}
