"use server";

import { auth } from "@/app/(auth)/auth";
import * as google from "@/lib/api/google";
import * as microsoft from "@/lib/api/microsoft";
import { APIError } from "@/lib/api/utils";
import type { StepCheckResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";

async function getAuthenticatedTokens(
  providers: ("google" | "microsoft")[] = ["google", "microsoft"]
) {
  const session = await auth();
  if (!session) throw new APIError("User not authenticated.", 401);
  const tokens: { googleToken?: string; microsoftToken?: string } = {};
  if (providers.includes("google")) {
    if (!session.googleToken)
      throw new APIError(
        "Google authentication required for this check.",
        401,
        "GOOGLE_AUTH_REQUIRED"
      );
    tokens.googleToken = session.googleToken;
  }
  if (providers.includes("microsoft")) {
    if (!session.microsoftToken)
      throw new APIError(
        "Microsoft authentication required for this check.",
        401,
        "MS_AUTH_REQUIRED"
      );
    tokens.microsoftToken = session.microsoftToken;
  }
  return tokens;
}

function handleCheckError(
  error: unknown,
  defaultMessage: string
): StepCheckResult {
  console.error(`Check Action Error - ${defaultMessage}:`, error);
  const message = error instanceof Error ? error.message : defaultMessage;
  return { completed: false, message };
}

export async function checkOrgUnitExists(
  ouPath: string
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    const orgUnit = await google.getOrgUnit(googleToken!, ouPath);
    if (orgUnit?.orgUnitId && orgUnit.orgUnitPath) {
      return {
        completed: true,
        message: `Organizational Unit '${ouPath}' found.`,
        outputs: {
          [OUTPUT_KEYS.AUTOMATION_OU_ID]: orgUnit.orgUnitId,
          [OUTPUT_KEYS.AUTOMATION_OU_PATH]: orgUnit.orgUnitPath,
        },
      };
    }
    return {
      completed: false,
      message: `Organizational Unit '${ouPath}' not found.`,
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Organizational Unit '${ouPath}' not found.`,
      };
    }
    return handleCheckError(e, `Failed to check for OU '${ouPath}'.`);
  }
}

export async function checkDomainVerified(
  domain: string
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    const domainDetails = await google.getDomain(googleToken!, domain);
    const isVerified = !!domainDetails?.verified;
    return {
      completed: isVerified,
      message: isVerified
        ? `Domain '${domain}' is verified.`
        : `Domain '${domain}' is not verified or not found. Verification is required for SAML SSO.`,
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Domain '${domain}' not found in Google Workspace.`,
      };
    }
    return handleCheckError(
      e,
      `Failed to check domain verification for '${domain}'.`
    );
  }
}

export async function checkGoogleSamlProfileDetails(
  profileDisplayName: string,
  checkExistsOnly: boolean,
  expectedIdpEntityId?: string
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    const profiles = await google.listSamlProfiles(googleToken!);
    const profile = profiles.find((p) => p.displayName === profileDisplayName);

    if (!profile?.name) {
      return {
        completed: false,
        message: `SAML Profile named '${profileDisplayName}' not found.`,
      };
    }

    const outputs = {
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
      [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]: profile.spConfig?.spEntityId,
      [OUTPUT_KEYS.GOOGLE_SAML_ACS_URL]:
        profile.spConfig?.assertionConsumerServiceUrl,
      ssoMode: profile.ssoMode,
      idpEntityId: profile.idpConfig?.idpEntityId,
    };

    if (checkExistsOnly) {
      return {
        completed: true,
        message: `SAML Profile '${profileDisplayName}' exists.`,
        outputs,
      };
    }

    const isConfigured = !!(
      profile.idpConfig?.idpEntityId &&
      profile.idpConfig?.ssoUrl &&
      profile.idpConfig?.certificates &&
      profile.idpConfig.certificates.length > 0 &&
      profile.ssoMode === "SAML_SSO_ENABLED"
    );

    if (!isConfigured) {
      return {
        completed: false,
        message: `SAML Profile '${profileDisplayName}' found but is not fully configured with IdP details or not enabled.`,
        outputs,
      };
    }

    if (
      expectedIdpEntityId &&
      profile.idpConfig?.idpEntityId !== expectedIdpEntityId
    ) {
      return {
        completed: false,
        message: `SAML Profile '${profileDisplayName}' is configured with IdP '${profile.idpConfig?.idpEntityId}', not the expected '${expectedIdpEntityId}'.`,
        outputs,
      };
    }

    return {
      completed: true,
      message: `SAML Profile '${profileDisplayName}' is correctly configured${
        expectedIdpEntityId ? ` with IdP '${expectedIdpEntityId}'` : ""
      } and enabled.`,
      outputs,
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Failed to check SAML Profile '${profileDisplayName}'.`
    );
  }
}

export async function checkMicrosoftServicePrincipal(
  appId: string
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const sp = await microsoft.getServicePrincipalByAppId(
      microsoftToken!,
      appId
    );
    if (sp?.id && sp.appId) {
      let appObjectId: string | undefined;
      const applications = await microsoft.listApplications(
        microsoftToken!,
        `appId eq '${appId}'`
      );
      if (applications[0]?.id) {
        appObjectId = applications[0].id;
      }
      return {
        completed: true,
        message: `Service Principal for App ID '${appId}' found: ${sp.displayName}.`,
        outputs: {
          // Using dynamic keys based on App ID might be complex to consume.
          // Consider using fixed keys if these outputs are for different types of apps (prov vs sso)
          // For now, using a prefix based on the purpose, assuming appId is passed correctly.
          [`${appId}_spId`]: sp.id,
          [`${appId}_appId`]: sp.appId,
          [`${appId}_appObjectId`]: appObjectId,
        },
      };
    }
    return {
      completed: false,
      message: `Service Principal for App ID '${appId}' not found.`,
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Failed to check for Service Principal with App ID '${appId}'.`
    );
  }
}

export async function checkMicrosoftServicePrincipalEnabled(
  spObjectId: string
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const sp = await microsoft.getServicePrincipalDetails(
      microsoftToken!,
      spObjectId
    );
    if (sp?.accountEnabled === true) {
      return { completed: true, message: "Service Principal is enabled." };
    }
    return {
      completed: false,
      message: sp
        ? "Service Principal is not enabled."
        : "Service Principal not found.",
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Service Principal with Object ID '${spObjectId}' not found.`,
      };
    }
    return handleCheckError(
      e,
      `Failed to check if Service Principal '${spObjectId}' is enabled.`
    );
  }
}

export async function checkMicrosoftProvisioningJobDetails(
  spObjectId: string,
  jobId?: string
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    let jobToInspect: microsoft.SynchronizationJob | null = null;
    if (jobId) {
      jobToInspect = await microsoft.getProvisioningJob(
        microsoftToken!,
        spObjectId,
        jobId
      );
    } else {
      const jobs = await microsoft.listSynchronizationJobs(
        microsoftToken!,
        spObjectId
      );
      jobToInspect =
        jobs.find((j) => j.templateId === "GoogleApps") ?? jobs[0] ?? null;
    }

    if (jobToInspect?.id) {
      const jobState = jobToInspect.schedule?.state ?? "Unknown";
      const lastExecutionError = jobToInspect.status?.lastExecution?.error; // Corrected property
      let message = `Provisioning job '${jobToInspect.id}' found. State: ${jobState}.`;
      if (lastExecutionError?.message) {
        message += ` Last execution error: ${lastExecutionError.message}`;
      }

      const credentialsLikelyOk = !lastExecutionError?.message
        ?.toLowerCase()
        .includes("invalidcredentials");
      const jobEffectivelyConfigured = !!jobToInspect.id && credentialsLikelyOk;

      return {
        completed: jobEffectivelyConfigured,
        message,
        outputs: {
          [OUTPUT_KEYS.PROVISIONING_JOB_ID]: jobToInspect.id,
          provisioningJobState: jobState,
        },
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
        message:
          "Provisioning not configured for this application (no sync schema/job).",
      };
    }
    return handleCheckError(
      e,
      `Failed to check provisioning job details for SP '${spObjectId}'.`
    );
  }
}

export async function checkMicrosoftAttributeMappingsApplied(
  spObjectId: string,
  jobId: string
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const schema = await microsoft.getSynchronizationSchema(
      microsoftToken!,
      spObjectId,
      jobId
    );
    const userMappingRule = schema?.synchronizationRules?.find(
      (rule: MicrosoftGraph.SynchronizationRule) =>
        rule.objectMappings?.some(
          (om: MicrosoftGraph.ObjectMapping) =>
            om.targetObjectName?.toLowerCase() === "user" &&
            om.sourceObjectName?.toLowerCase() === "user"
        )
    );
    const userObjectMapping = userMappingRule?.objectMappings?.find(
      (om: MicrosoftGraph.ObjectMapping) =>
        om.targetObjectName?.toLowerCase() === "user"
    );

    const hasUserPrincipalNameToUserName =
      userObjectMapping?.attributeMappings?.some(
        (am: MicrosoftGraph.AttributeMapping) =>
          am.targetAttributeName === "userName" &&
          am.source?.expression?.toLowerCase().includes("[userprincipalname]")
      );
    const hasMailToEmail = userObjectMapping?.attributeMappings?.some(
      (am: MicrosoftGraph.AttributeMapping) =>
        am.targetAttributeName === 'emails[type eq "work"].value' &&
        am.source?.expression?.toLowerCase().includes("[mail]")
    );

    if (hasUserPrincipalNameToUserName && hasMailToEmail) {
      return {
        completed: true,
        message: "Key default attribute mappings appear to be configured.",
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
    return handleCheckError(e, "Failed to check attribute mappings.");
  }
}

export async function checkMicrosoftSamlAppSettingsApplied(
  appObjectId: string,
  expectedSpEntityId: string,
  expectedAcsUrl: string
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const appDetails = await microsoft.getApplicationDetails(
      microsoftToken!,
      appObjectId
    );
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
        appDetails.identifierUris
      )}. `;
    if (!hasCorrectReplyUrl)
      message += `Expected Reply URL '${expectedAcsUrl}' not found in ${JSON.stringify(
        appDetails.web?.redirectUris
      )}.`;
    return { completed: false, message: message.trim() };
  } catch (e) {
    return handleCheckError(e, "Failed to check Azure AD SAML app settings.");
  }
}

export async function checkMicrosoftAppAssignments(
  servicePrincipalId: string
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const assignments = await microsoft.listAppRoleAssignments(
      microsoftToken!,
      servicePrincipalId
    );
    const hasAssignments = assignments && assignments.length > 0;
    return {
      completed: hasAssignments,
      message: hasAssignments
        ? "Application has user/group assignments."
        : "Application currently has no user/group assignments. Users must be assigned to use this application for SSO.",
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Service Principal '${servicePrincipalId}' not found for checking assignments.`,
      };
    }
    return handleCheckError(e, "Failed to check app assignments.");
  }
}
