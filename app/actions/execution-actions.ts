"use server";

import { auth } from "@/app/(auth)/auth";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import * as google from "@/lib/api/google";
import * as microsoft from "@/lib/api/microsoft";
import { APIError } from "@/lib/api/utils";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { validateRequiredOutputs } from "@/lib/utils";
import { portalUrls } from "@/lib/api/url-builder";
import type * as MicrosoftGraph from "microsoft-graph";

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
 * G-1: Create the 'Automation' Organizational Unit.
 */
export async function executeG1CreateAutomationOu(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const ouName = "Automation";
    const parentPath = "/";
    const result = await google.createOrgUnit(googleToken, ouName, parentPath);
    if (typeof result === "object" && "alreadyExists" in result) {
      const existing = await google.getOrgUnit(
        googleToken,
        `${parentPath}${ouName}`,
      );
      if (existing?.orgUnitId && existing.orgUnitPath) {
        return {
          success: true,
          message: `Organizational Unit '${ouName}' already exists.`,
          outputs: {
            [OUTPUT_KEYS.AUTOMATION_OU_ID]: existing.orgUnitId,
            [OUTPUT_KEYS.AUTOMATION_OU_PATH]: existing.orgUnitPath,
          },
          resourceUrl: portalUrls.google.orgUnits.details(existing.orgUnitPath),
        };
      }
      return {
        success: true,
        message: `Organizational Unit '${ouName}' already exists.`,
      };
    }
    if (!result.orgUnitId || !result.orgUnitPath) {
      return { success: false, error: { message: "Failed to create OU." } };
    }
    return {
      success: true,
      message: `Organizational Unit '${ouName}' created successfully.`,
      outputs: {
        [OUTPUT_KEYS.AUTOMATION_OU_ID]: result.orgUnitId,
        [OUTPUT_KEYS.AUTOMATION_OU_PATH]: result.orgUnitPath,
      },
      resourceUrl: portalUrls.google.orgUnits.details(result.orgUnitPath),
    };
  } catch (e) {
    return handleExecutionError(e, "G-1");
  }
}

/**
 * G-2: Create provisioning user within Automation OU.
 */
export async function executeG2CreateProvisioningUser(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const domain = context.domain;
    const ouPath = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string;
    if (!domain)
      return {
        success: false,
        error: { message: "Domain not available in context." },
      };
    if (!ouPath)
      return {
        success: false,
        error: { message: "Automation OU path not found." },
      };
    const email = `azuread-provisioning@${domain}`;
    const tempPassword = `P@${Date.now()}w0rd`;
    const user: google.DirectoryUser = {
      primaryEmail: email,
      name: { givenName: "Microsoft Entra ID", familyName: "Provisioning" },
      password: tempPassword,
      orgUnitPath: ouPath,
      changePasswordAtNextLogin: false,
    };
    const result = await google.createUser(googleToken, user);
    if (typeof result === "object" && "alreadyExists" in result) {
      const existing = await google.getUser(googleToken, email);
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
        error: { message: "Failed to create provisioning user." },
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
    return handleExecutionError(e, "G-2");
  }
}

/**
 * G-3: Grant Super Admin role to provisioning user.
 */
export async function executeG3GrantAdminToProvisioningUser(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
    if (!email)
      return {
        success: false,
        error: { message: "Provisioning user email missing." },
      };
    const user = await google.getUser(googleToken, email);
    if (user?.isAdmin) {
      return {
        success: true,
        message: `User '${email}' is already an admin.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    const roles = await google.listRoleAssignments(googleToken, email);
    if (roles.some((r) => r.roleId === "3")) {
      return {
        success: true,
        message: `User '${email}' already has Super Admin role.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    await google.assignAdminRole(googleToken, email, "3");
    return {
      success: true,
      message: `Super Admin role assigned to '${email}'.`,
      outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
      resourceUrl: portalUrls.google.users.details(email),
    };
  } catch (e) {
    return handleExecutionError(e, "G-3");
  }
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
        !existingProfile.spConfig?.entityId ||
        !existingProfile.spConfig?.assertionConsumerServiceUri
      ) {
        return {
          success: false,
          error: {
            message: `SAML Profile '${profileDisplayName}' appears to exist but required details could not be retrieved from Google. Remove any partial profile in the Admin Console and rerun step G-5.`,
            code: "SAML_PROFILE_FETCH_FAILED",
          },
        };
      }
      const resourceUrl = portalUrls.google.sso.samlProfile(
        existingProfile.name,
      );
      return {
        success: true,
        message: `SAML Profile '${profileDisplayName}' already exists. Using its details.`,
        resourceUrl,
        outputs: {
          [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: existingProfile.displayName,
          [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: existingProfile.name,
          [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]:
            existingProfile.spConfig.entityId,
          [OUTPUT_KEYS.GOOGLE_SAML_ACS_URL]:
            existingProfile.spConfig.assertionConsumerServiceUri,
        },
      };
    }
    if (
      !result.name ||
      !result.spConfig?.entityId ||
      !result.spConfig?.assertionConsumerServiceUri
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
    const resourceUrl = portalUrls.google.sso.samlProfile(result.name);
    return {
      success: true,
      message: `SAML Profile '${profileDisplayName}' created in Google Workspace.`,
      resourceUrl,
      outputs: {
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME]: result.displayName,
        [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME]: result.name,
        [OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID]: result.spConfig.entityId,
        [OUTPUT_KEYS.GOOGLE_SAML_ACS_URL]:
          result.spConfig.assertionConsumerServiceUri,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "G-5");
  }
}

/**
 * G-S0: Enable provisioning on the existing SAML profile and guide token retrieval
 */
export async function executeGS0EnableProvisioning(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;

    if (!profileFullName) {
      return {
        success: false,
        error: {
          message:
            "SAML profile not found. Complete G-5 (Initiate Google SAML Profile) first.",
          code: "MISSING_DEPENDENCY",
        },
      };
    }

    return {
      success: true,
      message:
        "To enable provisioning on your existing SAML profile:\n\n" +
        "1. Click below to open your 'Azure AD SSO' profile\n" +
        "2. Click 'SET UP AUTOMATIC USER PROVISIONING'\n" +
        "3. Copy the 'Authorization token'\n" +
        "4. Return here and click 'Enter Token'\n\n" +
        "This uses the same SAML profile from step G-5 - no temporary app needed!",
      resourceUrl: portalUrls.google.sso.samlProfile(profileFullName),
    };
  } catch (e) {
    return handleExecutionError(e, "G-S0");
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
        entityId: idpEntityId,
        singleSignOnServiceUri: ssoUrl,
      },
    });
    await google.addIdpCredentials(googleToken, profileFullName, certificate);
    return {
      success: true,
      message: "Google SAML Profile updated with Azure AD IdP information.",
      resourceUrl: portalUrls.google.sso.main(),
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
      resourceUrl: portalUrls.google.sso.main(),
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

    // Check if an Automation OU exists (it might have been created manually)
    const automationOu = await google.getOrgUnit(googleToken, "/Automation");

    if (!automationOu?.orgUnitId) {
      return {
        success: true,
        message:
          "No Automation OU found. This step is optional and only needed if you have a dedicated OU for service accounts.",
      };
    }

    await google.assignSamlToOrgUnits(googleToken, profileFullName, [
      { orgUnitId: automationOu.orgUnitId, ssoMode: "SSO_OFF" },
    ]);
    return {
      success: true,
      message: `SAML explicitly disabled for the 'Automation' OU (${automationOu.orgUnitPath}).`,
      resourceUrl: portalUrls.google.sso.main(),
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
          const resourceUrl = portalUrls.azure.enterpriseApp.overview(
            sp.id as string,
            existingApp.appId as string,
          );
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
    const resourceUrl = portalUrls.azure.enterpriseApp.overview(
      spObjectId,
      appId,
    );
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
  const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as
    | string
    | undefined;
  const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
    | string
    | undefined;
  const resourceUrl =
    spId && appId
      ? portalUrls.azure.enterpriseApp.provisioning(spId, appId)
      : portalUrls.azure.myApps();

  return {
    success: true,
    message:
      "ACTION REQUIRED: In the Azure portal, open the provisioning app, click 'Authorize', and sign in with the Google provisioning user created in G-2. After testing the connection, mark this step complete.",
    outputs: { [OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]: true },
    resourceUrl,
  };
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
    const resourceUrl = portalUrls.azure.enterpriseApp.provisioning(
      spObjectId,
      appId,
    );
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
    const resourceUrl = portalUrls.azure.enterpriseApp.provisioning(
      spObjectId,
      appId,
    );
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
          const resourceUrl = portalUrls.azure.enterpriseApp.overview(
            sp.id as string,
            existingApp.appId,
          );
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
      resourceUrl: portalUrls.azure.enterpriseApp.overview(
        result.servicePrincipal.id as string,
        result.application.appId as string,
      ),
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
      resourceUrl: portalUrls.azure.enterpriseApp.singleSignOn(
        spObjectId,
        appId,
      ),
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
    const resourceUrl = portalUrls.azure.enterpriseApp.singleSignOn(
      spObjectId,
      samlSsoAppId,
    );
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
      resourceUrl: portalUrls.azure.enterpriseApp.usersAndGroups(
        ssoSpObjectId,
        appId,
      ),
    };
  } catch (e) {
    return handleExecutionError(e, "M-9");
  }
}
