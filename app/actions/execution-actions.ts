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
  stepId?: string
): Promise<StepExecutionResult> {
  console.error(
    `Execution Action Failed (Step ${stepId || "Unknown"}):`,
    error
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
      "GOOGLE_AUTH_REQUIRED"
    );
  if (!session?.microsoftToken)
    throw new APIError(
      "Microsoft authentication token is missing.",
      401,
      "MS_AUTH_REQUIRED"
    );
  if (!session?.microsoftTenantId)
    throw new APIError(
      "Microsoft tenant ID is missing from session.",
      401,
      "MS_TENANT_ID_REQUIRED"
    );
  return {
    googleToken: session.googleToken,
    microsoftToken: session.microsoftToken,
    tenantId: session.microsoftTenantId,
  };
}

// --- Google Execution Actions ---
export async function executeG1CreateAutomationOu(
  context: StepContext
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const result = await google.createOrgUnit(googleToken, "Automation", "/");
    if (typeof result === "object" && "alreadyExists" in result) {
      const existingOu = await google.getOrgUnit(googleToken, "/Automation");
      if (!existingOu?.orgUnitId || !existingOu?.orgUnitPath) {
        throw new Error(
          "OU 'Automation' reported as existing but could not be fetched to confirm details."
        );
      }
      return {
        success: true,
        message: "Organizational Unit 'Automation' already exists.",
        resourceUrl: "https://admin.google.com/ac/orgunits",
        outputs: {
          [OUTPUT_KEYS.AUTOMATION_OU_ID]: existingOu.orgUnitId,
          [OUTPUT_KEYS.AUTOMATION_OU_PATH]: existingOu.orgUnitPath,
        },
      };
    }
    return {
      success: true,
      message: "Successfully created 'Automation' Organizational Unit.",
      resourceUrl: "https://admin.google.com/ac/orgunits",
      outputs: {
        [OUTPUT_KEYS.AUTOMATION_OU_ID]: result.orgUnitId,
        [OUTPUT_KEYS.AUTOMATION_OU_PATH]: result.orgUnitPath,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "G-1");
  }
}

export async function executeG4AddAndVerifyDomain(
  context: StepContext
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
      };
    }
    return {
      success: true,
      message: `Domain '${context.domain}' added to Google Workspace. Please ensure it is verified in your Google Workspace Admin console for SAML SSO to function correctly.`,
      resourceUrl: "https://admin.google.com/ac/domains/manage",
    };
  } catch (e) {
    return handleExecutionError(e, "G-4");
  }
}

export async function executeG5InitiateGoogleSamlProfile(
  context: StepContext
): Promise<StepExecutionResult> {
  try {
    const { googleToken } = await getTokens();
    const profileDisplayName = "Azure AD SSO";
    const result = await google.createSamlProfile(
      googleToken,
      profileDisplayName
    );

    if (typeof result === "object" && "alreadyExists" in result) {
      const profiles = await google.listSamlProfiles(googleToken);
      const existingProfile = profiles.find(
        (p) => p.displayName === profileDisplayName
      );
      if (
        !existingProfile?.name ||
        !existingProfile.spConfig?.spEntityId ||
        !existingProfile.spConfig?.assertionConsumerServiceUrl
      ) {
        throw new Error(
          `SAML Profile '${profileDisplayName}' reported as existing but essential details could not be fetched.`
        );
      }
      return {
        success: true,
        message: `SAML Profile '${profileDisplayName}' already exists. Retrieved its details.`,
        resourceUrl: "https://admin.google.com/ac/sso",
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
        "Created SAML profile is missing expected configuration details (name, SP Entity ID, ACS URL)."
      );
    }
    return {
      success: true,
      message: `SAML Profile '${profileDisplayName}' created successfully in Google Workspace.`,
      resourceUrl: "https://admin.google.com/ac/sso",
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

export async function executeG6UpdateGoogleSamlWithAzureIdp(
  context: StepContext
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
            "Required IdP SAML details or Google profile name not found in context outputs. Ensure steps G-5 and M-8 completed.",
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
        "Google SAML Profile updated successfully with Azure AD IdP information and enabled.",
      resourceUrl: `https://admin.google.com/ac/sso/profile/${profileFullName
        .split("/")
        .pop()}`,
    };
  } catch (e) {
    return handleExecutionError(e, "G-6");
  }
}

export async function executeG7AssignGoogleSamlToRootOu(
  context: StepContext
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
          message: "Google SAML Profile full name not found in context.",
        },
      };

    await google.assignSamlToOrgUnits(googleToken, profileFullName, [
      { orgUnitId: "/", ssoMode: "SAML_SSO_ENABLED" },
    ]);
    return {
      success: true,
      message:
        "SAML profile assigned to the Root OU and enabled for all users (unless overridden by sub-OU settings). You can adjust specific OU/Group assignments in the Google Admin console.",
      resourceUrl: "https://admin.google.com/ac/sso",
    };
  } catch (e) {
    return handleExecutionError(e, "G-7");
  }
}

export async function executeG8ExcludeAutomationOuFromSso(
  context: StepContext
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
        error: { message: "Google SAML Profile name not found." },
      };
    if (!automationOuId)
      return {
        success: true,
        message: "Automation OU ID not found; skipping SSO disable for it.",
      };

    await google.assignSamlToOrgUnits(googleToken, profileFullName, [
      { orgUnitId: automationOuId, ssoMode: "SSO_OFF" },
    ]);
    return {
      success: true,
      message: "SAML successfully disabled for the 'Automation' OU.",
      resourceUrl: "https://admin.google.com/ac/sso",
    };
  } catch (e) {
    return handleExecutionError(e, "G-8");
  }
}

// --- Microsoft Execution Actions ---
export async function executeM1CreateProvisioningApp(
  context: StepContext
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const GWS_PROVISIONING_TEMPLATE_ID = "8b1025e4-1dd2-430b-a150-2ef79cd700f5"; // Google Workspace Gallery App
    const appName = "Google Workspace User Provisioning";

    const result = await microsoft.createEnterpriseApp(
      microsoftToken,
      GWS_PROVISIONING_TEMPLATE_ID,
      appName
    );
    if (typeof result === "object" && "alreadyExists" in result) {
      // Attempt to fetch existing app details to populate outputs
      const existingApp = (
        await microsoft.listApplications(
          microsoftToken,
          `displayName eq '${appName}'`
        )
      )[0];
      if (existingApp?.appId) {
        const sp = await microsoft.getServicePrincipalByAppId(
          microsoftToken,
          existingApp.appId
        );
        if (existingApp.id && sp?.id) {
          return {
            success: true,
            message: `Enterprise app '${appName}' for provisioning already exists. Using existing details.`,
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
        message: `Enterprise app '${appName}' already exists, but could not retrieve all its details.`,
      };
    }
    return {
      success: true,
      message: `Enterprise app '${appName}' for User Provisioning created successfully.`,
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${result.application.appId}`,
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

export async function executeM2ConfigureProvisioningAppProperties(
  context: StepContext
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
            "Provisioning Service Principal Object ID not found (from M-1).",
        },
      };

    await microsoft.patchServicePrincipal(microsoftToken, spObjectId, {
      accountEnabled: true,
    });
    return {
      success: true,
      message: "Provisioning app's Service Principal enabled successfully.",
      outputs: { [OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED]: true },
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-2");
  }
}

export async function executeM3AuthorizeProvisioningConnection(
  context: StepContext
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
      // If no job ID in outputs, try to create or find existing
      const jobResult = await microsoft.createProvisioningJob(
        microsoftToken,
        spObjectId
      );
      if (typeof jobResult === "object" && "alreadyExists" in jobResult) {
        const jobs = await microsoft.listSynchronizationJobs(
          microsoftToken,
          spObjectId
        );
        const googleAppsJob = jobs.find((j) => j.templateId === "GoogleApps"); // Common template ID
        if (!googleAppsJob?.id)
          throw new Error(
            "Provisioning job reported as existing but its ID could not be determined."
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

    return {
      success: true,
      message:
        "Provisioning job created/found and connection authorized with Google Workspace. Test connection in Azure Portal.",
      outputs: {
        [OUTPUT_KEYS.PROVISIONING_JOB_ID]: jobId,
        [OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED]: true,
      },
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-3");
  }
}

export async function executeM4ConfigureProvisioningAttributeMappings(
  context: StepContext
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

    const attributeMappingSourceTypeAttribute: MicrosoftGraph.AttributeMappingSourceType =
      "Attribute";

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
            // Optional Group Provisioning Mapping (ensure group object and attributes exist if enabled)
            // {
            //   enabled: false, // Set true to enable group provisioning
            //   sourceObjectName: "group",
            //   targetObjectName: "Group",
            //   attributeMappings: [
            //     { targetAttributeName: "displayName", source: { expression: "[displayName]", name: "displayName", type: attributeMappingSourceTypeAttribute }, matchingPriority: 1 },
            //     { targetAttributeName: "externalId", source: { expression: "[objectId]", name: "objectId", type: attributeMappingSourceTypeAttribute }, matchingPriority: 2 },
            //     { targetAttributeName: "members", source: { name: "members", type: attributeMappingSourceTypeAttribute } }
            //   ]
            // }
          ],
        },
      ],
    };

    await microsoft.configureAttributeMappings(
      microsoftToken,
      spObjectId,
      jobId,
      schemaPayload
    );
    return {
      success: true,
      message:
        "Default attribute mappings configured for user provisioning. Review and customize in Azure Portal if needed.",
      outputs: { [OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED]: true },
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}/syncSchemaEditorV2`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-4");
  }
}

export async function executeM5StartProvisioningJob(
  context: StepContext
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
    return {
      success: true,
      message:
        "User provisioning job started. Monitor progress in Azure Portal. IMPORTANT: Ensure you have configured the correct provisioning scope (users/groups to sync) in the Azure Portal for this provisioning app.",
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/Provisioning/servicePrincipalId/${spObjectId}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-5");
  }
}

export async function executeM6CreateSamlSsoApp(
  context: StepContext
): Promise<StepExecutionResult> {
  try {
    const { microsoftToken } = await getTokens();
    const GWS_SAML_TEMPLATE_ID = "8b1025e4-1dd2-430b-a150-2ef79cd700f5"; // Google Workspace Gallery App
    const appName = "Google Workspace SAML SSO";

    const result = await microsoft.createEnterpriseApp(
      microsoftToken,
      GWS_SAML_TEMPLATE_ID,
      appName
    );
    if (typeof result === "object" && "alreadyExists" in result) {
      let existingAppId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as
        | string
        | undefined;
      // Logic to fetch existing app details if needed (similar to M-1 alreadyExists)
      if (existingAppId) {
        const existingSp = await microsoft.getServicePrincipalByAppId(
          microsoftToken,
          existingAppId
        );
        const applications = await microsoft.listApplications(
          microsoftToken,
          `appId eq '${existingAppId}'`
        );
        const existingAppObjectId = applications[0]?.id;
        if (existingSp?.id && existingAppObjectId) {
          return {
            success: true,
            message: `Enterprise app '${appName}' for SAML SSO already exists. Using existing details.`,
            outputs: {
              [OUTPUT_KEYS.SAML_SSO_APP_ID]: existingAppId,
              [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: existingAppObjectId,
              [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: existingSp.id,
            },
          };
        }
      }
      return {
        success: true,
        message: `Enterprise app '${appName}' for SAML SSO already exists, but could not confirm all its details.`,
      };
    }
    return {
      success: true,
      message: `Enterprise app '${appName}' for SAML SSO created successfully.`,
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/appId/${result.application.appId}`,
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

export async function executeM7ConfigureAzureSamlAppSettings(
  context: StepContext
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
        error: {
          message: "Primary domain (for identifier URI) not configured.",
        },
      };

    const appPatchPayload: Partial<microsoft.Application> = {
      identifierUris: [googleSpEntityId, `https://${primaryDomain}`], // Per Google article and common practice
      web: {
        redirectUris: [googleAcsUrl],
        implicitGrantSettings: {
          enableIdTokenIssuance: false,
          enableAccessTokenIssuance: false,
        },
      },
      // Default NameID claim (UPN) is usually set by the gallery app template.
      // For claims: check Azure Portal, "User Attributes & Claims" for the SAML App.
      // This tool applies basic SAML config. Advanced claims are manual.
    };
    await microsoft.updateApplication(
      microsoftToken,
      appObjectId,
      appPatchPayload
    );
    return {
      success: true,
      message:
        "Azure AD SAML app settings (Identifier URIs, Reply URL) configured. Verify User Attributes & Claims in Azure Portal.",
      outputs: { [OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED]: true },
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/ApplicationBlade/objectId/${appObjectId}/ κάτι/SingleSignOn`, // Deeplink to SSO config
    };
  } catch (e) {
    return handleExecutionError(e, "M-7");
  }
}

export async function executeM8RetrieveAzureIdpMetadata(
  context: StepContext
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
    return {
      success: true,
      message:
        "Azure AD IdP SAML metadata (Entity ID, SSO URL, Certificate) retrieved successfully.",
      outputs: {
        [OUTPUT_KEYS.IDP_CERTIFICATE_BASE64]: metadata.certificate,
        [OUTPUT_KEYS.IDP_SSO_URL]: metadata.ssoUrl,
        [OUTPUT_KEYS.IDP_ENTITY_ID]: metadata.entityId,
      },
    };
  } catch (e) {
    return handleExecutionError(e, "M-8");
  }
}

export async function executeM9AssignUsersToAzureSsoApp(
  context: StepContext
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

    // This step is primarily a guidance step as user/group assignment is a manual selection in Azure.
    // The check action `checkMicrosoftAppAssignments` verifies if *any* assignments exist.
    return {
      success: true,
      message:
        "Guidance: Assign users and/or groups to the 'Google Workspace SAML SSO' application in Azure AD to enable them to use Single Sign-On. This is done in the Azure Portal under the app's 'Users and groups' section.",
      resourceUrl: `https://portal.azure.com/#view/Microsoft_AAD_IAM/EnterpriseApplicationMenuBlade/~/UsersAndGroups/servicePrincipalId/${ssoSpObjectId}`,
    };
  } catch (e) {
    return handleExecutionError(e, "M-9");
  }
}
