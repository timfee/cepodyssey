"use server";

import { auth } from "@/app/(auth)/auth";
import * as google from "@/lib/api/google";
import * as microsoft from "@/lib/api/microsoft";
import { APIError } from "@/lib/api/utils";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";
import { validateRequiredOutputs } from "@/lib/utils";

/**
 * Azure Portal URL Reference:
 *
 * Gallery apps from Azure AD create both an App Registration and Enterprise Application.
 * ALL configuration for gallery apps happens in the Enterprise Application interface:
 *
 * - Overview: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/{spId}/appId/{appId}
 * - Provisioning: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/{appId}/objectId/{spId}
 * - Single Sign-On: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/{appId}/objectId/{spId}
 * - Users/Groups: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/{spId}/appId/{appId}
 *
 * Note: Microsoft uses inconsistent parameter names (servicePrincipalId vs objectId) across blades.
 */

/**
 * Convert an unexpected error into a standardized execution result.
 * Logs the failure with the associated step when provided.
 *
 * @param error - The thrown error or rejection value
 * @param stepId - Optional step identifier for context
 * @returns Failed StepExecutionResult with error message
 */
async function handleExecutionError(
  error: unknown,
  stepId?: string,
): Promise<StepExecutionResult> {
  console.error(
    `Execution Action Failed (Step ${stepId || "Unknown"}):`,
    error,
  );
  if (isAuthenticationError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        code: "AUTH_EXPIRED",
      },
      outputs: {
        errorCode: "AUTH_EXPIRED",
        errorProvider: error.provider,
      },
    };
  }
  if (error instanceof APIError) {
    return {
      success: false,
      error: { message: error.message, code: error.code },
    };
  }
  const message =
    error instanceof Error
      ? error.message
      : "An unknown error occurred during execution.";
  return { success: false, error: { message } };
}

/**
 * Retrieve both provider tokens and the tenant ID from the session.
 * Throws a descriptive APIError when any required value is missing.
 */
async function getTokens(): Promise<{
  googleToken: string;
  microsoftToken: string;
  tenantId: string;
}> {
  const session = await auth();
  if (!session?.googleToken)
    throw new APIError(
      "Google authentication token is missing.",
      401,
      "GOOGLE_AUTH_REQUIRED",
    );
  if (!session?.microsoftToken)
    throw new APIError(
      "Microsoft authentication token is missing.",
      401,
      "MS_AUTH_REQUIRED",
    );
  if (!session?.microsoftTenantId)
    throw new APIError(
      "Microsoft tenant ID is missing from session.",
      401,
      "MS_TENANT_ID_REQUIRED",
    );
  return {
    googleToken: session.googleToken,
    microsoftToken: session.microsoftToken,
    tenantId: session.microsoftTenantId,
  };
}

// Google Execution Actions
/**
 * G-1: Create the Automation organizational unit if it does not exist.
 */
export async function executeG1CreateAutomationOu(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const result = await google.createOrgUnit(googleToken, "Automation", "/");
    if (typeof result === "object" && "alreadyExists" in result) {
      const existingOu = await google.getOrgUnit(googleToken, "/Automation");
      if (!existingOu?.orgUnitId || !existingOu?.orgUnitPath) {
        return {
          success: false,
          error: {
            message:
              "Google reported the 'Automation' organizational unit already exists, but its details could not be retrieved. Delete any partial OU in the Admin console and rerun step G-1.",
            code: "OU_FETCH_FAILED",
          },
        };
      }
      const resourceUrl = existingOu.orgUnitPath
        ? `https://admin.google.com/ac/orgunits#path=${encodeURIComponent(existingOu.orgUnitPath)}`
        : "https://admin.google.com/ac/orgunits";
      return {
        success: true,
        message: "Organizational Unit 'Automation' already exists.",
        resourceUrl,
        outputs: {
          [OUTPUT_KEYS.AUTOMATION_OU_ID]: existingOu.orgUnitId,
          [OUTPUT_KEYS.AUTOMATION_OU_PATH]: existingOu.orgUnitPath,
        },
      };
    }
    const resourceUrl = result.orgUnitPath
      ? `https://admin.google.com/ac/orgunits#path=${encodeURIComponent(result.orgUnitPath)}`
      : "https://admin.google.com/ac/orgunits";
    return {
      success: true,
      message: "Successfully created 'Automation' Organizational Unit.",
      resourceUrl,
      outputs: {
        [OUTPUT_KEYS.AUTOMATION_OU_ID]: result.orgUnitId,
        [OUTPUT_KEYS.AUTOMATION_OU_PATH]: result.orgUnitPath,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "G-1");
  }
}

export async function executeG2CreateServiceAccount(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.AUTOMATION_OU_PATH,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure G-1 (Create Automation OU) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const automationOuPath = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string;
    const domain = context.domain;
    const timestamp = Date.now();
    const serviceAccountEmail = `automation-${timestamp}@${domain}`;
    const password = generateSecurePassword();
    const userPayload = {
      primaryEmail: serviceAccountEmail,
      name: { givenName: "Automation", familyName: "Service Account" },
      password,
      orgUnitPath: automationOuPath,
      changePasswordAtNextLogin: false,
    } as Partial<google.DirectoryUser>;

    const result = await google.createUser(googleToken, userPayload);

    if (typeof result === "object" && "alreadyExists" in result) {
      const users = await google.listUsers(googleToken, {
        query: `orgUnitPath='${automationOuPath}' email:automation-*`,
      });
      const existingServiceAccount = users.find(
        (u) => u.primaryEmail?.startsWith("automation-") && u.orgUnitPath === automationOuPath,
      );
      if (existingServiceAccount) {
        return {
          success: true,
          message: `Service account '${existingServiceAccount.primaryEmail}' already exists in Automation OU.`,
          outputs: {
            [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: existingServiceAccount.primaryEmail,
            [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: existingServiceAccount.id,
          },
          resourceUrl: `https://admin.google.com/ac/users/${existingServiceAccount.primaryEmail}`,
        };
      }
      return {
        success: false,
        error: {
          message: "Service account creation reported as duplicate but could not find existing account.",
        },
      };
    }

    return {
      success: true,
      message: `Service account '${result.primaryEmail}' created successfully. Password stored securely in outputs.`,
      outputs: {
        [OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]: result.primaryEmail,
        [OUTPUT_KEYS.SERVICE_ACCOUNT_ID]: result.id,
        [OUTPUT_KEYS.SERVICE_ACCOUNT_PASSWORD]: password,
      },
      resourceUrl: `https://admin.google.com/ac/users/${result.primaryEmail}`,
    };
  } catch (e) {
    return handleExecutionError(e, "G-2");
  }
}

export async function executeG3GrantAdminPrivileges(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure G-2 (Create Service Account) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const serviceAccountEmail = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
    const roles = await google.listAdminRoles(googleToken);
    const superAdminRole = roles.find(
      (r) => r.roleName === "_SEED_ADMIN_ROLE" || r.roleId === "3",
    );
    if (!superAdminRole?.roleId) {
      return {
        success: false,
        error: { message: "Could not find Super Admin role in Google Workspace." },
      };
    }
    const result = await google.assignAdminRole(
      googleToken,
      serviceAccountEmail,
      superAdminRole.roleId,
    );
    if (typeof result === "object" && "alreadyExists" in result) {
      return {
        success: true,
        message: `Service account '${serviceAccountEmail}' already has admin privileges.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: superAdminRole.roleId },
        resourceUrl: "https://admin.google.com/ac/roles/admins",
      };
    }
    return {
      success: true,
      message: `Super Admin role assigned to service account '${serviceAccountEmail}'.`,
      outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: superAdminRole.roleId },
      resourceUrl: "https://admin.google.com/ac/roles/admins",
    };
  } catch (e) {
    return handleExecutionError(e, "G-3");
  }
}

function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 20; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * G-4: Add the primary domain to Google Workspace and notify for verification.
 */
export async function executeG4AddAndVerifyDomain(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    if (!context.domain)
      return {
        success: false,
        error: { message: "Primary domain not available in context." },
      };
    const result = await google.addDomain(googleToken, context.domain);
    if (typeof result === "object" && "alreadyExists" in result) {
      return {
        success: true,
        message: `Domain '${context.domain}' was already added/exists in Google Workspace.`,
        resourceUrl: `https://admin.google.com/ac/domains/manage?domain=${encodeURIComponent(context.domain)}`,
      };
    }
    return {
      success: true,
      message: `Domain '${context.domain}' added. Please ensure it is verified in your Google Workspace Admin console for SAML SSO.`,
      resourceUrl: `https://admin.google.com/ac/domains/manage?domain=${encodeURIComponent(context.domain)}`,
    };
  } catch (e) {
    return handleExecutionError(e, "G-4");
  }
}

/**
 * G-5: Create the initial Google SAML profile.
 */
export async function executeG5InitiateGoogleSamlProfile(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const profileDisplayName = "Azure AD SSO";
    const result = await google.createSamlProfile(
      googleToken,
      profileDisplayName,
    );

    if (typeof result === "object" && "alreadyExists" in result) {
      const profiles = await google.listSamlProfiles(googleToken);
      const existingProfile = profiles.find(
        (p) => p.displayName === profileDisplayName,
      );
      if (
        !existingProfile?.name ||
        !existingProfile.spConfig?.spEntityId ||
        !existingProfile.spConfig?.assertionConsumerServiceUrl
      ) {
        return {
          success: false,
          error: {
            message: `SAML Profile '${profileDisplayName}' appears to exist but required details could not be retrieved from Google. Remove any partial profile in the Admin Console and rerun step G-5.`,
            code: "SAML_PROFILE_FETCH_FAILED",
          },
        };
      }
      const profileId = existingProfile.name.split("/").pop();
      const resourceUrl = profileId
        ? `https://admin.google.com/ac/sso/profile/${profileId}`
        : "https://admin.google.com/ac/sso";
      return {
        success: true,
        message: `SAML Profile '${profileDisplayName}' already exists. Using its details.`,
        resourceUrl,
        outputs: {
          [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: existingProfile.displayName,
          [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: existingProfile.name,
          [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]:
            existingProfile.spConfig.spEntityId,
          [OUTPUT_KEYS.GOOGLE_SAML_ACS_URL]:
            existingProfile.spConfig.assertionConsumerServiceUrl,
        },
      };
    }
    if (
      !result.name ||
      !result.spConfig?.spEntityId ||
      !result.spConfig?.assertionConsumerServiceUrl
    ) {
      return {
        success: false,
        error: {
          message:
            "Google did not return the expected SAML profile details after creation. Delete the profile in the Admin Console and rerun step G-5.",
          code: "SAML_PROFILE_MISSING_DETAILS",
        },
      };
    }
    const profileId = result.name.split("/").pop();
    const resourceUrl = profileId
      ? `https://admin.google.com/ac/sso/profile/${profileId}`
      : "https://admin.google.com/ac/sso";
    return {
      success: true,
      message: `SAML Profile '${profileDisplayName}' created in Google Workspace.`,
      resourceUrl,
      outputs: {
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: result.displayName,
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: result.name,
        [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]: result.spConfig.spEntityId,
        [OUTPUT_KEYS.GOOGLE_SAML_ACS_URL]:
          result.spConfig.assertionConsumerServiceUrl,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "G-5");
  }
}

/**
 * G-6: Update the Google SAML profile with Azure IdP metadata.
 */
export async function executeG6UpdateGoogleSamlWithAzureIdp(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
      OUTPUT_KEYS.IDP_ENTITY_ID,
      OUTPUT_KEYS.IDP_SSO_URL,
      OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure M-8 (Retrieve Azure Idp Metadata) and G-5 completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
    const ssoUrl = context.outputs[OUTPUT_KEYS.IDP_SSO_URL] as string;
    const certificate = context.outputs[
      OUTPUT_KEYS.IDP_CERTIFICATE_BASE64
    ] as string;

    await google.updateSamlProfile(googleToken, profileFullName, {
      idpConfig: {
        idpEntityId,
        ssoUrl,
        signRequest: true,
        certificates: [{ certificateData: certificate }],
      },
      ssoMode: "SAML_SSO_ENABLED",
    });
    return {
      success: true,
      message:
        "Google SAML Profile updated with Azure AD IdP information and enabled.",
      resourceUrl: "https://admin.google.com/ac/sso",
    };
  } catch (e) {
    return handleExecutionError(e, "G-6");
  }
}

/**
 * G-7: Assign the Google SAML profile to the root OU.
 */
export async function executeG7AssignGoogleSamlToRootOu(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure G-6 (Update Google SAML Profile with Azure IdP) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;

    await google.assignSamlToOrgUnits(googleToken, profileFullName, [
      { orgUnitId: "/", ssoMode: "SAML_SSO_ENABLED" },
    ]);
    return {
      success: true,
      message:
        "SAML profile assigned to Root OU for all users. Specific OU/Group assignments can be adjusted in Google Admin console.",
      resourceUrl: "https://admin.google.com/ac/sso",
    };
  } catch (e) {
    return handleExecutionError(e, "G-7");
  }
}

/**
 * G-8: Exclude the Automation OU from SSO requirements.
 */
export async function executeG8ExcludeAutomationOuFromSso(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure G-7 (Assign Google SAML Profile to Root OU) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    const automationOuId = context.outputs[
      OUTPUT_KEYS.AUTOMATION_OU_ID
    ] as string;

    if (!automationOuId)
      return {
        success: true,
        message: "Automation OU ID missing; skipping SSO disable for it.",
      };

    await google.assignSamlToOrgUnits(googleToken, profileFullName, [
      { orgUnitId: automationOuId, ssoMode: "SSO_OFF" },
    ]);
    return {
      success: true,
      message: "SAML explicitly disabled for the 'Automation' OU.",
      resourceUrl: "https://admin.google.com/ac/sso",
    };
  } catch (e) {
    return handleExecutionError(e, "G-8");
  }
}

// Microsoft Execution Actions
/**
 * M-1: Create the provisioning Enterprise application in Azure.
 */
export async function executeM1CreateProvisioningApp(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const GWS_PROVISIONING_TEMPLATE_ID = "8b1025e4-1dd2-430b-a150-2ef79cd700f5";
    const appName = "Google Workspace User Provisioning";

    const result = await microsoft.createEnterpriseApp(
      microsoftToken,
      GWS_PROVISIONING_TEMPLATE_ID,
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
          const resourceUrl =
            `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${existingApp.appId}/objectId/${sp.id}`;
          return {
            success: true,
            message: `Enterprise app '${appName}' for provisioning already exists.`,
            resourceUrl,
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
      resourceUrl:
        `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${result.application.appId}/objectId/${result.servicePrincipal.id}`,
      outputs: {
        [OUTPUT_KEYS.PROVISIONING_APP_ID]: result.application.appId,
        [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: result.application.id,
        [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: result.servicePrincipal.id,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "M-1");
  }
}

/**
 * M-2: Configure properties for the provisioning application.
 */
export async function executeM2ConfigureProvisioningAppProperties(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure M-1 (Create Provisioning App) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    await microsoft.patchServicePrincipal(microsoftToken, spObjectId, {
      accountEnabled: true,
    });
    const resourceUrl =
      `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spObjectId}/appId/${appId}`;
    return {
      success: true,
      message: "Provisioning app service principal enabled.",
      outputs: { [OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED]: true },
      resourceUrl,
    };
  } catch (e) {
    return handleExecutionError(e, "M-2");
  }
}

/**
 * M-3: Authorize the provisioning connection between Azure and Google.
 */
export async function executeM3AuthorizeProvisioningConnection(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure G-S0 (Get Google Secret Token) and M-2 completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const googleSecretToken = context.outputs[
      OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    if (googleSecretToken.length < 50 || googleSecretToken.includes(" ")) {
      return {
        success: false,
        error: {
          message:
            "The Google provisioning token appears to be invalid. Please ensure you copied the entire token without any spaces.",
          code: "INVALID_TOKEN_FORMAT",
        },
      };
    }

    let jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as
      | string
      | undefined;
    if (!jobId) {
      const jobResult = await microsoft.createProvisioningJob(
        microsoftToken,
        spObjectId,
      );
      if (typeof jobResult === "object" && "alreadyExists" in jobResult) {
        const jobs = await microsoft.listSynchronizationJobs(
          microsoftToken,
          spObjectId,
        );
        const googleAppsJob = jobs.find((j) => j.templateId === "GoogleApps");
        if (!googleAppsJob?.id)
          return {
            success: false,
            error: {
              message:
                "Azure reported a provisioning job already exists but its ID could not be retrieved. Delete any existing job in the Azure portal or clear this tool's state, then rerun step M-3.",
              code: "PROV_JOB_ID_NOT_FOUND",
            },
          };
        jobId = googleAppsJob.id;
      } else {
        if (!jobResult.id)
          return {
            success: false,
            error: {
              message:
                "Provisioning job was created but Azure did not return a job ID. Delete the provisioning job in Azure and retry step M-3.",
              code: "PROV_JOB_ID_MISSING",
            },
          };
        jobId = jobResult.id;
      }
    }

    await microsoft.updateProvisioningCredentials(microsoftToken, spObjectId, [
      { key: "SecretToken", value: googleSecretToken },
      {
        key: "BaseAddress",
        value: "https://www.googleapis.com/admin/directory/v1.12/scim",
      },
    ]);

    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spObjectId}`;
    return {
      success: true,
      message:
        "Provisioning job created/found and connection authorized. The connection will be tested when you start the provisioning job. If the test fails, verify the token was copied correctly.",
      outputs: {
        [OUTPUT_KEYS.PROVISIONING_JOB_ID]: jobId,
        [OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]: true,
      },
      resourceUrl,
    };
  } catch (e) {
    if (e instanceof APIError && e.message?.includes("InvalidCredentials")) {
      return {
        success: false,
        error: {
          message:
            "The Google provisioning token is invalid or expired. Please get a new token from Google Admin Console (step G-S0) and try again.",
          code: "INVALID_CREDENTIALS",
        },
      };
    }
    return handleExecutionError(e, "M-3");
  }
}

/**
 * M-4: Configure attribute mappings used for provisioning.
 */
export async function executeM4ConfigureProvisioningAttributeMappings(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      OUTPUT_KEYS.PROVISIONING_JOB_ID,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure M-3 (Authorize Provisioning Connection) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    const attributeMappingSourceTypeAttribute =
      "Attribute" as MicrosoftGraph.AttributeMappingSourceType;

    const schemaPayload: {
      synchronizationRules: MicrosoftGraph.SynchronizationRule[];
    } = {
      synchronizationRules: [
        {
          name: "UserProvisioningToGoogleWorkspace",
          sourceDirectoryName: "Azure Active Directory",
          targetDirectoryName: "Google Workspace",
          objectMappings: [
            {
              enabled: true,
              sourceObjectName: "user",
              targetObjectName: "User",
              attributeMappings: [
                {
                  targetAttributeName: "userName",
                  source: {
                    expression: "[userPrincipalName]",
                    name: "userPrincipalName",
                    type: attributeMappingSourceTypeAttribute,
                  },
                  matchingPriority: 1,
                },
                {
                  targetAttributeName: "active",
                  source: {
                    expression: "[accountEnabled]",
                    name: "accountEnabled",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "displayName",
                  source: {
                    expression: "[displayName]",
                    name: "displayName",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "name.givenName",
                  source: {
                    expression: "[givenName]",
                    name: "givenName",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "name.familyName",
                  source: {
                    expression: "[surname]",
                    name: "surname",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: 'emails[type eq "work"].value',
                  source: {
                    expression: "[mail]",
                    name: "mail",
                    type: attributeMappingSourceTypeAttribute,
                  },
                },
                {
                  targetAttributeName: "externalId",
                  source: {
                    expression: "[objectId]",
                    name: "objectId",
                    type: attributeMappingSourceTypeAttribute,
                  },
                  matchingPriority: 2,
                },
              ],
            },
          ],
        },
      ],
    };

    await microsoft.configureAttributeMappings(
      microsoftToken,
      spObjectId,
      jobId,
      schemaPayload,
    );
    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spObjectId}`;
    return {
      success: true,
      message:
        "Default attribute mappings configured. Review in Azure Portal; customize if specific needs exist.",
      outputs: { [OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED]: true },
      resourceUrl,
    };
  } catch (e) {
    return handleExecutionError(e, "M-4");
  }
}

/**
 * M-5: Start the provisioning job in Azure.
 */
export async function executeM5StartProvisioningJob(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      OUTPUT_KEYS.PROVISIONING_JOB_ID,
      OUTPUT_KEYS.PROVISIONING_APP_ID,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure M-4 (Configure Provisioning Attribute Mappings) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    await microsoft.startProvisioningJob(microsoftToken, spObjectId, jobId);
    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spObjectId}`;
    return {
      success: true,
      message:
        "User provisioning job started. Monitor its progress in the Azure Portal. Ensure user/group scope for provisioning is correctly set in Azure.",
      resourceUrl,
    };
  } catch (e) {
    return handleExecutionError(e, "M-5");
  }
}

/**
 * M-6: Create the Azure SAML SSO application.
 */
export async function executeM6CreateSamlSsoApp(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const GWS_SAML_TEMPLATE_ID = "8b1025e4-1dd2-430b-a150-2ef79cd700f5";
    const appName = "Google Workspace SAML SSO";

    const result = await microsoft.createEnterpriseApp(
      microsoftToken,
      GWS_SAML_TEMPLATE_ID,
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
          const resourceUrl =
            `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${existingApp.appId}/objectId/${sp.id}`;
          return {
            success: true,
            message: `Enterprise app '${appName}' for SAML SSO already exists.`,
            resourceUrl,
            outputs: {
              [OUTPUT_KEYS.SAML_SSO_APP_ID]: existingApp.appId,
              [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: existingApp.id,
              [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: sp.id,
            },
          };
        }
      }
      return {
        success: true,
        message: `Enterprise app '${appName}' for SAML SSO already exists, but full details not retrieved.`,
      };
    }
    return {
      success: true,
      message: `Enterprise app '${appName}' for SAML SSO created.`,
      resourceUrl:
        `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${result.application.appId}/objectId/${result.servicePrincipal.id}`,
      outputs: {
        [OUTPUT_KEYS.SAML_SSO_APP_ID]: result.application.appId,
        [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: result.application.id,
        [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: result.servicePrincipal.id,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "M-6");
  }
}

/**
 * M-7: Apply Entity ID and Reply URL settings on the Azure SAML app.
 */
export async function executeM7ConfigureAzureSamlAppSettings(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
      OUTPUT_KEYS.SAML_SSO_APP_ID,
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
      OUTPUT_KEYS.GOOGLE_SAML_ACS_URL,
    ]);
    if (!validation.valid || !context.domain) {
      const missing = [...validation.missing];
      if (!context.domain) missing.push("domain");
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${missing.join(", ")}. Ensure M-6 (Create SAML SSO App) and G-5 completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const appObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
    ] as string;
    const spObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    const googleSpEntityId = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
    ] as string;
    const googleAcsUrl = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_ACS_URL
    ] as string;
    const primaryDomain = context.domain;

    const appPatchPayload: Partial<microsoft.Application> = {
      identifierUris: [googleSpEntityId, `https://${primaryDomain}`],
      web: {
        redirectUris: [googleAcsUrl],
        implicitGrantSettings: {
          enableIdTokenIssuance: false,
          enableAccessTokenIssuance: false,
        },
      },
    };
    await microsoft.updateApplication(
      microsoftToken,
      appObjectId,
      appPatchPayload,
    );
    return {
      success: true,
      message:
        "Azure AD SAML app (Identifier URIs, Reply URL) configured. Verify 'User Attributes & Claims' (NameID should be UPN) manually in Azure Portal.",
      outputs: { [OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED]: true },
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spObjectId}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-7");
  }
}

/**
 * M-8: Retrieve IdP metadata from Azure for use in Google.
 */
export async function executeM8RetrieveAzureIdpMetadata(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { tenantId } = await getTokens();
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.SAML_SSO_APP_ID,
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure M-7 (Configure Azure SAML App Settings) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const samlSsoAppId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    const spObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID
    ] as string;

    const metadata = await microsoft.getSamlMetadata(tenantId, samlSsoAppId);
    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${samlSsoAppId}/objectId=${spObjectId}`;
    return {
      success: true,
      message:
        "Azure AD IdP SAML metadata (Entity ID, SSO URL, Certificate) retrieved.",
      outputs: {
        [OUTPUT_KEYS.IDP_CERTIFICATE_BASE64]: metadata.certificate,
        [OUTPUT_KEYS.IDP_SSO_URL]: metadata.ssoUrl,
        [OUTPUT_KEYS.IDP_ENTITY_ID]: metadata.entityId,
      },
      resourceUrl,
    };
  } catch (e) {
    return handleExecutionError(e, "M-8");
  }
}

/**
 * M-9: Guide the admin to assign users to the Azure SSO application.
 */
export async function executeM9AssignUsersToAzureSsoApp(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const validation = validateRequiredOutputs(context.outputs, [
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
      OUTPUT_KEYS.SAML_SSO_APP_ID,
    ]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: `Missing required outputs: ${validation.missing.join(", ")}. Ensure M-6 (Create SAML SSO App) completed successfully.`,
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const ssoSpObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    return {
      success: true,
      message:
        "Guidance: Assign users/groups to the 'Google Workspace SAML SSO' app in Azure AD via its 'Users and groups' section to grant them SSO access.",
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/${ssoSpObjectId}/appId/${appId}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-9");
  }
}
