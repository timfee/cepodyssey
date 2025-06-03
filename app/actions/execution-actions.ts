"use server";

import { auth } from "@/app/(auth)/auth";
import * as google from "@/lib/api/google";
import * as microsoft from "@/lib/api/microsoft";
import { APIError } from "@/lib/api/utils";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import type * as MicrosoftGraph from "microsoft-graph";

async function handleExecutionError(
  error: unknown,
  stepId?: string,
): Promise<StepExecutionResult> {
  console.error(
    `Execution Action Failed (Step ${stepId || "Unknown"}):`,
    error,
  );
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

// --- Google Execution Actions ---
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
        throw new Error(
          "OU 'Automation' reported as existing but could not be fetched.",
        );
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
        throw new Error(
          `SAML Profile '${profileDisplayName}' reported existing but details (name, SP Entity ID, ACS URL) not fetched.`,
        );
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
      throw new Error(
        "Created Google SAML profile is missing expected details (name, SP Entity ID, ACS URL).",
      );
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
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
    const ssoUrl = context.outputs[OUTPUT_KEYS.IDP_SSO_URL] as string;
    const certificate = context.outputs[
      OUTPUT_KEYS.IDP_CERTIFICATE_BASE64
    ] as string;

    if (!profileFullName || !idpEntityId || !ssoUrl || !certificate) {
      return {
        success: false,
        error: {
          message:
            "Required IdP SAML details or Google profile name missing from context. Ensure G-5 and M-8 outputs are available.",
        },
      };
    }

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
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    if (!profileFullName)
      return {
        success: false,
        error: {
          message: "Google SAML Profile full name missing from context.",
        },
      };

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
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;
    const automationOuId = context.outputs[
      OUTPUT_KEYS.AUTOMATION_OU_ID
    ] as string;

    if (!profileFullName)
      return {
        success: false,
        error: { message: "Google SAML Profile name missing." },
      };
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

// --- Microsoft Execution Actions ---
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
          const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${existingApp.appId}/objectId/${existingApp.id}`;
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
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${result.application.appId}/objectId/${result.application.id}`,
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
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    if (!spObjectId)
      return {
        success: false,
        error: {
          message:
            "Provisioning Service Principal Object ID (from M-1) not found.",
        },
      };

    await microsoft.patchServicePrincipal(microsoftToken, spObjectId, {
      accountEnabled: true,
    });
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
      | string
      | undefined;
    const resourceUrl = appId
      ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${appId}/objectId/${spObjectId}`
      : `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spObjectId}`;
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
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const googleSecretToken = context.outputs[
      OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN
    ] as string;

    if (!spObjectId)
      return {
        success: false,
        error: { message: "Provisioning SP Object ID (from M-1) not found." },
      };
    if (!googleSecretToken)
      return {
        success: false,
        error: {
          message: "Google Provisioning Secret Token (from G-S0) not found.",
        },
      };

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
          throw new Error(
            "Provisioning job reported as existing but its ID could not be determined.",
          );
        jobId = googleAppsJob.id;
      } else {
        if (!jobResult.id)
          throw new Error("Provisioning job creation did not return an ID.");
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

    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
      | string
      | undefined;
    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}/appId/${appId ?? ""}`;
    return {
      success: true,
      message:
        "Provisioning job created/found and connection authorized. Use 'Test Connection' in Azure Portal to verify.",
      outputs: {
        [OUTPUT_KEYS.PROVISIONING_JOB_ID]: jobId,
        [OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]: true,
      },
      resourceUrl,
    };
  } catch (e) {
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
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;

    if (!spObjectId || !jobId)
      return {
        success: false,
        error: {
          message: "Provisioning SP Object ID or Job ID (from M-3) not found.",
        },
      };

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
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
      | string
      | undefined;
    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}/appId/${appId ?? ""}`;
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
    const spObjectId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;

    if (!spObjectId || !jobId)
      return {
        success: false,
        error: {
          message: "Provisioning SP Object ID or Job ID (from M-3) not found.",
        },
      };

    await microsoft.startProvisioningJob(microsoftToken, spObjectId, jobId);
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
      | string
      | undefined;
    const resourceUrl = `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}/appId/${appId ?? ""}`;
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
          return {
            success: true,
            message: `Enterprise app '${appName}' for SAML SSO already exists.`,
            resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${existingApp.appId}/objectId/${existingApp.id}`,
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
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${result.application.appId}/objectId/${result.application.id}`,
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
    const appObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
    ] as string;
    const googleSpEntityId = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
    ] as string;
    const googleAcsUrl = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_ACS_URL
    ] as string;
    const primaryDomain = context.domain;

    if (!appObjectId)
      return {
        success: false,
        error: { message: "SAML SSO App Object ID (from M-6) not found." },
      };
    if (!googleSpEntityId)
      return {
        success: false,
        error: { message: "Google SP Entity ID (from G-5) not found." },
      };
    if (!googleAcsUrl)
      return {
        success: false,
        error: { message: "Google ACS URL (from G-5) not found." },
      };
    if (!primaryDomain)
      return {
        success: false,
        error: { message: "Primary domain not configured." },
      };

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
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ApplicationBlade/objectId/${appObjectId}/~/SingleSignOn`,
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
    const samlSsoAppId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    if (!samlSsoAppId)
      return {
        success: false,
        error: { message: "SAML SSO App (Client) ID (from M-6) not found." },
      };

    const metadata = await microsoft.getSamlMetadata(tenantId, samlSsoAppId);
    const appObjectId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID] as
      | string
      | undefined;
    const resourceUrl = appObjectId
      ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ApplicationBlade/objectId/${appObjectId}/~/SingleSignOn`
      : undefined;
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
    const ssoSpObjectId = context.outputs[
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID
    ] as string;
    if (!ssoSpObjectId)
      return {
        success: false,
        error: {
          message: "SAML SSO Service Principal Object ID (from M-6) not found.",
        },
      };
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as
      | string
      | undefined;
    return {
      success: true,
      message:
        "Guidance: Assign users/groups to the 'Google Workspace SAML SSO' app in Azure AD via its 'Users and groups' section to grant them SSO access.",
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/UsersAndGroups/servicePrincipalId/${ssoSpObjectId}/appId/${appId ?? ""}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-9");
  }
}
