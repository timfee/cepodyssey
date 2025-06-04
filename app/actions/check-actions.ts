"use server";

import { auth } from "@/app/(auth)/auth";
import {
  AuthenticationError,
  isAuthenticationError,
} from "@/lib/api/auth-interceptor";
import * as google from "@/lib/api/google";
import * as microsoft from "@/lib/api/microsoft";
import { APIError } from "@/lib/api/utils";
import type { StepCheckResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";
import type { Session } from "next-auth";

function validateTokens(session: Session | null): asserts session is Session {
  if (!session) {
    throw new AuthenticationError("No session found", "google");
  }
  if (session.error === "RefreshTokenError") {
    throw new AuthenticationError("Session expired - refresh failed", "google");
  }
  if (!session.googleToken) {
    throw new AuthenticationError("Google authentication required", "google");
  }
  if (!session.microsoftToken) {
    throw new AuthenticationError(
      "Microsoft authentication required",
      "microsoft",
    );
  }
}
/**
 * Retrieve auth tokens for the requested providers from the session.
 */

async function getAuthenticatedTokens(
  providers: ("google" | "microsoft")[] = ["google", "microsoft"],
) {
  const session = await auth();
  validateTokens(session);
  const tokens: { googleToken?: string; microsoftToken?: string } = {};
  if (providers.includes("google")) {
    if (!session.googleToken)
      throw new AuthenticationError("Google authentication required", "google");
    tokens.googleToken = session.googleToken;
  }
  if (providers.includes("microsoft")) {
    if (!session.microsoftToken)
      throw new AuthenticationError(
        "Microsoft authentication required",
        "microsoft",
      );
    tokens.microsoftToken = session.microsoftToken;
  }
  return tokens;
}

/**
 * Log a check error and convert it to a StepCheckResult.
 */

function handleCheckError(
  error: unknown,
  defaultMessage: string,
): StepCheckResult {
  console.error(`Check Action Error - ${defaultMessage}:`, error);

  // Special handling for auth errors - rethrow them to be handled by the dashboard
  if (isAuthenticationError(error)) {
    throw error; // Propagate auth errors to be handled by the UI
  }

  // For API enablement errors, include the enhanced message and code
  if (error instanceof APIError) {
    return {
      completed: false,
      message: error.message,
      outputs: {
        errorCode: error.code,
        errorMessage: error.message,
        errorStatus: error.status,
      },
    };
  }

  const message = error instanceof Error ? error.message : defaultMessage;
  return {
    completed: false,
    message,
    outputs: {
      errorCode: "UNKNOWN_ERROR",
      errorMessage: message,
    },
  };
}
/**
 * Verify that the specified Google Workspace organizational unit exists.
 */

export async function checkOrgUnitExists(
  ouPath: string,
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
          resourceUrl: `https://admin.google.com/ac/orgunits?ouid=${orgUnit.orgUnitId}`,
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

/**
 * Check if a domain is verified in Google Workspace.
 */
export async function checkDomainVerified(
  domain: string,
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    const domainDetails = await google.getDomain(googleToken!, domain);
    const isVerified = !!(
      typeof domainDetails === "object" &&
      domainDetails &&
      "verified" in domainDetails &&
      domainDetails.verified
    );
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
      `Failed to check domain verification for '${domain}'.`,
    );
  }
}

export async function checkServiceAccountExists(
  serviceAccountEmail: string,
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    const user = await google.getUser(googleToken!, serviceAccountEmail);
    if (user?.primaryEmail) {
      return {
        completed: true,
        message: `Service account '${serviceAccountEmail}' exists.`,
        outputs: {
          [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: user.primaryEmail,
          [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: user.id,
        },
      };
    }
    return {
      completed: false,
      message: `Service account '${serviceAccountEmail}' not found.`,
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Service account '${serviceAccountEmail}' not found.`,
      };
    }
    return handleCheckError(e, `Failed to check service account existence.`);
  }
}

export async function checkServiceAccountIsAdmin(
  serviceAccountEmail: string,
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    const user = await google.getUser(googleToken!, serviceAccountEmail);
    if (!user) {
      return {
        completed: false,
        message: `Service account '${serviceAccountEmail}' not found.`,
      };
    }
    if (user.isAdmin === true && user.suspended === false) {
      return {
        completed: true,
        message: `Service account '${serviceAccountEmail}' has admin privileges.`,
      };
    }
    const roleAssignments = await google.listRoleAssignments(
      googleToken!,
      serviceAccountEmail,
    );
    const hasSuperAdminRole = roleAssignments.some(
      (assignment) => assignment.roleId === "3",
    );
    if (hasSuperAdminRole) {
      return {
        completed: true,
        message: `Service account has Super Admin role assigned.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
      };
    }
    return {
      completed: false,
      message: `Service account exists but lacks admin privileges.`,
    };
  } catch (e) {
    return handleCheckError(e, `Failed to check admin status.`);
  }
}

export async function checkG1AutomationOuExists(): Promise<StepCheckResult> {
  return checkOrgUnitExists("/Automation");
}

export async function checkG2ProvisioningUserExists(
  domain: string,
): Promise<StepCheckResult> {
  const email = `azuread-provisioning@${domain}`;
  return checkServiceAccountExists(email);
}

export async function checkG3ProvisioningUserIsAdmin(
  email: string,
): Promise<StepCheckResult> {
  return checkServiceAccountIsAdmin(email);
}

/**
 * Inspect a Google SAML profile by display name or full resource name.
 */
export async function checkGoogleSamlProfileDetails(
  profileDisplayNameOrFullName: string,
  checkExistsOnly: boolean,
  expectedIdpEntityId?: string,
): Promise<StepCheckResult> {
  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);
    let profile: google.InboundSamlSsoProfile | null = null;

    if (profileDisplayNameOrFullName.startsWith("inboundSamlSsoProfiles/")) {
      profile = await google.getSamlProfile(
        googleToken!,
        profileDisplayNameOrFullName,
      );
    } else {
      const profiles = await google.listSamlProfiles(googleToken!);
      profile =
        profiles.find((p) => p.displayName === profileDisplayNameOrFullName) ??
        null;
    }

    if (!profile?.name) {
      return {
        completed: false,
        message: `SAML Profile '${profileDisplayNameOrFullName}' not found.`,
      };
    }

    const profileId = profile.name.split("/").pop();
    const resourceUrl = profileId
      ? `https://admin.google.com/ac/security/sso/sso-profiles/inboundSamlSsoProfiles%2F${profileId}`
      : "https://admin.google.com/ac/sso";

    const outputs: Record<string, unknown> = {
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: profile.displayName,
      [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: profile.name,
      idpEntityId: profile.idpConfig?.entityId,
      ssoMode: profile.ssoMode,
      resourceUrl,
    };
    if (profile.spConfig?.entityId) {
      outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] = profile.spConfig.entityId;
    }
    if (profile.spConfig?.assertionConsumerServiceUri) {
      outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] =
        profile.spConfig.assertionConsumerServiceUri;
    }

    if (checkExistsOnly) {
      return {
        completed: true,
        message: `SAML Profile '${profile.displayName}' exists.`,
        outputs,
      };
    }

    const idpCreds = await google.listIdpCredentials(
      googleToken!,
      profile.name,
    );
    const isConfigured = !!(
      profile.idpConfig?.entityId &&
      profile.idpConfig?.singleSignOnServiceUri &&
      idpCreds.length > 0
    );

    if (!isConfigured) {
      return {
        completed: false,
        message: `SAML Profile '${profile.displayName}' found but is not fully configured with IdP details or not enabled.`,
        outputs,
      };
    }

    if (
      expectedIdpEntityId &&
      profile.idpConfig?.entityId !== expectedIdpEntityId
    ) {
      return {
        completed: false,
        message: `SAML Profile '${profile.displayName}' is configured with IdP '${profile.idpConfig?.entityId}', not the expected '${expectedIdpEntityId}'.`,
        outputs,
      };
    }

    return {
      completed: true,
      message: `SAML Profile '${profile.displayName}' is correctly configured${
        expectedIdpEntityId ? ` with IdP '${expectedIdpEntityId}'` : ""
      }`,
      outputs,
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Failed to check SAML Profile '${profileDisplayNameOrFullName}'.`,
    );
  }
}

/**
 * Ensure the Azure service principal for the application exists.
 */
export async function checkMicrosoftServicePrincipal(
  appClientId: string,
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const sp = await microsoft.getServicePrincipalByAppId(
      microsoftToken!,
      appClientId,
    );
    if (sp?.id && sp.appId) {
      let appObjectId: string | undefined;
      const applications = await microsoft.listApplications(
        microsoftToken!,
        `appId eq '${appClientId}'`,
      );
      if (applications[0]?.id) {
        appObjectId = applications[0].id;
      }
      // These outputs are generic for any SP found by appClientId.
      // The calling lambda in lib/steps/ will map these to specific OUTPUT_KEYS (e.g., PROVISIONING_SP_OBJECT_ID or SAML_SSO_SP_OBJECT_ID).
      const outputs = {
        spId: sp.id,
        retrievedAppId: sp.appId,
        appObjectId: appObjectId,
        displayName: sp.displayName,
        resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${sp.id}/appId/${sp.appId}`,
      };
      return {
        completed: true,
        message: `Service Principal for App Client ID '${appClientId}' found: ${sp.displayName}.`,
        outputs: outputs,
      };
    }
    return {
      completed: false,
      message: `Service Principal for App Client ID '${appClientId}' not found.`,
    };
  } catch (e) {
    return handleCheckError(
      e,
      `Failed to check for Service Principal with App Client ID '${appClientId}'.`,
    );
  }
}

/**
 * Check whether the given Azure service principal is enabled.
 */
export async function checkMicrosoftServicePrincipalEnabled(
  spObjectId: string,
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const sp = await microsoft.getServicePrincipalDetails(
      microsoftToken!,
      spObjectId,
    );
    if (sp?.accountEnabled === true) {
      return { completed: true, message: "Service Principal is enabled." };
    }
    return {
      completed: false,
      message: sp
        ? "Service Principal is not enabled."
        : "Service Principal not found. Ensure step M-1 (Create Provisioning App) completed successfully. If the Enterprise Application was removed in Azure, clear this tool's state and start over.",
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
      `Failed to check if Service Principal '${spObjectId}' is enabled.`,
    );
  }
}

/**
 * Retrieve provisioning job details for an Azure service principal.
 */
export async function checkMicrosoftProvisioningJobDetails(
  spObjectId: string,
  jobId?: string,
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    let jobToInspect: microsoft.SynchronizationJob | null = null;
    if (jobId) {
      jobToInspect = await microsoft.getProvisioningJob(
        microsoftToken!,
        spObjectId,
        jobId,
      );
    } else {
      const jobs = await microsoft.listSynchronizationJobs(
        microsoftToken!,
        spObjectId,
      );
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
      const jobEffectivelyConfigured = !!jobToInspect.id && credentialsLikelyOk;

      // Use the fixed OUTPUT_KEYS.PROVISIONING_JOB_ID for the job ID output.
      // The calling step (e.g., M-3 or M-5 check) is specifically about the main provisioning app.
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
    return handleCheckError(
      e,
      `Failed to check provisioning job for SP '${spObjectId}'.`,
    );
  }
}

/**
 * Verify default user attribute mappings are present in the provisioning schema.
 */
export async function checkMicrosoftAttributeMappingsApplied(
  spObjectId: string,
  jobId: string,
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const schema = await microsoft.getSynchronizationSchema(
      microsoftToken!,
      spObjectId,
      jobId,
    );
    const userMappingRule = schema?.synchronizationRules?.find(
      (rule: MicrosoftGraph.SynchronizationRule) =>
        rule.objectMappings?.some(
          (om: MicrosoftGraph.ObjectMapping) =>
            om.targetObjectName?.toLowerCase() === "user" &&
            om.sourceObjectName?.toLowerCase() === "user",
        ),
    );
    const userObjectMapping = userMappingRule?.objectMappings?.find(
      (om: MicrosoftGraph.ObjectMapping) =>
        om.targetObjectName?.toLowerCase() === "user",
    );

    const hasUserPrincipalNameToUserName =
      userObjectMapping?.attributeMappings?.some(
        (am: MicrosoftGraph.AttributeMapping) =>
          am.targetAttributeName === "userName" &&
          am.source?.expression?.toLowerCase().includes("[userprincipalname]"),
      );
    const hasMailToEmail = userObjectMapping?.attributeMappings?.some(
      (am: MicrosoftGraph.AttributeMapping) =>
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
    return handleCheckError(e, "Failed to check attribute mappings.");
  }
}

/**
 * Confirm the Azure AD SAML app has the expected Entity ID and Reply URL.
 */
export async function checkMicrosoftSamlAppSettingsApplied(
  appObjectId: string,
  expectedSpEntityId: string,
  expectedAcsUrl: string,
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const appDetails = await microsoft.getApplicationDetails(
      microsoftToken!,
      appObjectId,
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
        appDetails.identifierUris,
      )}. `;
    if (!hasCorrectReplyUrl)
      message += `Expected Reply URL '${expectedAcsUrl}' not found in ${JSON.stringify(
        appDetails.web?.redirectUris,
      )}.`;
    return { completed: false, message: message.trim() };
  } catch (e) {
    return handleCheckError(e, "Failed to check Azure AD SAML app settings.");
  }
}

/**
 * Determine if any users or groups are assigned to the Azure application.
 */
export async function checkMicrosoftAppAssignments(
  servicePrincipalObjectId: string,
): Promise<StepCheckResult> {
  try {
    const { microsoftToken } = await getAuthenticatedTokens(["microsoft"]);
    const assignments = await microsoft.listAppRoleAssignments(
      microsoftToken!,
      servicePrincipalObjectId,
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
    return handleCheckError(
      e,
      "Failed to check app assignments for SP " + servicePrincipalObjectId,
    );
  }
}

export async function checkGoogleAPIsEnabled(): Promise<{
  adminSDK: boolean;
  cloudIdentity: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let adminSDK = false;
  let cloudIdentity = false;

  try {
    const { googleToken } = await getAuthenticatedTokens(["google"]);

    // Try a simple Admin SDK call
    try {
      await google.getUser(googleToken!, "test@nonexistent.domain");
      adminSDK = true;
    } catch (e) {
      if (
        e instanceof APIError &&
        e.message?.includes("Admin SDK API has not been used")
      ) {
        errors.push("Admin SDK API is not enabled");
      } else {
        adminSDK = true; // API is enabled, user doesn't exist
      }
    }

    // Try a simple Cloud Identity call
    try {
      await google.listSamlProfiles(googleToken!);
      cloudIdentity = true;
    } catch (e) {
      if (
        e instanceof APIError &&
        e.message?.includes("Cloud Identity API has not been used")
      ) {
        errors.push("Cloud Identity API is not enabled");
      } else {
        cloudIdentity = true; // API is enabled
      }
    }
  } catch (e) {
    errors.push(
      "Unable to check API status: " +
        (e instanceof Error ? e.message : String(e)),
    );
  }

  return { adminSDK, cloudIdentity, errors };
}
