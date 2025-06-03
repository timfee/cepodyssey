import {
  checkDomainVerified,
  checkGoogleSamlProfileDetails,
  checkMicrosoftAppAssignments,
  checkMicrosoftAttributeMappingsApplied,
  checkMicrosoftProvisioningJobDetails,
  checkMicrosoftSamlAppSettingsApplied,
  checkMicrosoftServicePrincipal,
  checkMicrosoftServicePrincipalEnabled,
  checkOrgUnitExists,
} from "@/app/actions/check-actions";

import {
  executeG1CreateAutomationOu,
  executeG4AddAndVerifyDomain,
  executeG5InitiateGoogleSamlProfile,
  executeG6UpdateGoogleSamlWithAzureIdp,
  executeG7AssignGoogleSamlToRootOu,
  executeG8ExcludeAutomationOuFromSso,
  executeM1CreateProvisioningApp,
  executeM2ConfigureProvisioningAppProperties,
  executeM3AuthorizeProvisioningConnection,
  executeM4ConfigureProvisioningAttributeMappings,
  executeM5StartProvisioningJob,
  executeM6CreateSamlSsoApp,
  executeM7ConfigureAzureSamlAppSettings,
  executeM8RetrieveAzureIdpMetadata,
  executeM9AssignUsersToAzureSsoApp,
} from "@/app/actions/execution-actions";

import type {
  StepCheckResult,
  StepContext,
  StepDefinition,
  StepExecutionResult,
} from "./types";
import { OUTPUT_KEYS } from "./types";

/**
 * Declarative list of all automation steps in execution order.
 * Each definition contains metadata plus check and execute handlers.
 */
export const allStepDefinitions: StepDefinition[] = [
  // Phase 1: Initial Google Workspace Setup
  {
    id: "G-1",
    title: "Create 'Automation' OU (Optional)",
    description:
      "Creates an Organizational Unit (OU) named 'Automation' in Google Workspace. This can be useful for applying specific settings or housing accounts related to automated processes, although this tool primarily operates using the logged-in administrator's permissions.",
    category: "Google",
    automatable: true,
    requires: [],
    check: (_context: StepContext): Promise<StepCheckResult> =>
      checkOrgUnitExists("/Automation"),
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeG1CreateAutomationOu(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/orgunits",
      verify: "https://admin.google.com/ac/orgunits",
    },
  },
  {
    id: "G-S0",
    title: "Get Google Secret Token for User Provisioning",
    description:
      "Manual: Enable 'Automated user provisioning' in Google Workspace Admin console and copy the generated OAuth Bearer Token (Secret Token). This token is required by Azure AD to provision users into your Google Workspace. Input this token when prompted by this tool.",
    category: "Google",
    automatable: false,
    requires: [],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      return context.outputs[OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN]
        ? {
            completed: true,
            message:
              "Secret Token for Google Workspace provisioning is noted as provided.",
          }
        : {
            completed: false,
            message:
              "Secret Token needed. Follow instructions to retrieve and enter it into this tool.",
          };
    },
    execute: async (_context: StepContext): Promise<StepExecutionResult> => ({
      success: true,
      message:
        "In Google Workspace Admin Console (admin.google.com):\n1. Navigate: Apps > Web and mobile apps.\n2. Click 'Add app' > 'Add custom SAML app' (this path often leads to provisioning settings, or search directly for 'Automatic user provisioning').\n3. Find and enable 'Automatic user provisioning'.\n4. Securely copy the generated 'Access token' (this is the 'Secret Token').\n5. The 'Tenant URL' for Azure AD setup will be 'https://www.googleapis.com/admin/directory/v1.12/scim'.\n6. Input the copied Access Token into this tool's UI for step M-3 (the UI for this step should handle saving it to outputs).",
      resourceUrl: "https://admin.google.com/ac/apps/unified#/settings/scim",
    }),
    adminUrls: {
      configure: "https://admin.google.com/ac/apps/unified#/settings/scim",
      verify: "https://admin.google.com/ac/apps/unified#/settings/scim",
    },
  },
  {
    id: "G-4",
    title: "Add & Verify Domain for Federation",
    description:
      "Ensures the primary domain you intend to federate with Azure AD (as configured in this tool) is added and verified within your Google Workspace account. This is essential for SAML-based Single Sign-On.",
    category: "Google",
    automatable: true,
    requires: [],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      if (!context.domain)
        return {
          completed: false,
          message: "Primary domain not configured in this tool.",
        };
      return checkDomainVerified(context.domain);
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeG4AddAndVerifyDomain(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/domains/manage",
      verify: "https://admin.google.com/ac/domains/manage",
    },
  },
  {
    id: "G-5",
    title: "Initiate Google SAML Profile & Get SP Details",
    description:
      "Creates (or ensures existence of) a SAML SSO profile in Google Workspace for Azure AD, named 'Azure AD SSO'. This step retrieves Google's unique Assertion Consumer Service (ACS) URL and Entity ID, which are required for configuring the SAML application in Azure AD.",
    category: "Google",
    automatable: true,
    requires: ["G-4"],
    check: (_context: StepContext): Promise<StepCheckResult> =>
      checkGoogleSamlProfileDetails("Azure AD SSO", true, undefined),
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeG5InitiateGoogleSamlProfile(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/sso",
      verify: "https://admin.google.com/ac/sso",
    },
  },

  // Phase 2: Azure AD - App 1 (User Provisioning)
  {
    id: "M-1",
    title: "Create Azure AD Enterprise App for Provisioning",
    description:
      "Adds the 'Google Cloud / G Suite Connector by Microsoft' gallery application in Azure AD. This specific app instance will be dedicated to managing user provisioning from Azure AD to Google Workspace.",
    category: "Microsoft",
    automatable: true,
    requires: [],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as
        | string
        | undefined;
      if (!appId)
        return {
          completed: false,
          message:
            "Provisioning App ID (from previous run or manual setup) must be in this tool's outputs to check.",
        };
      return checkMicrosoftServicePrincipal(appId);
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM1CreateProvisioningApp(context),
    adminUrls: {
      configure: (outputs) => {
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!appId) return "https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview";
        return `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/${appId}/isMSAApp~/false`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        return spId
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId || ""}`
          : null;
      },
    },
  },
  {
    id: "M-2",
    title: "Enable Provisioning App Service Principal",
    description:
      "Ensures the Service Principal associated with the Azure AD provisioning application is enabled, allowing it to operate.",
    category: "Microsoft",
    automatable: true,
    requires: ["M-1"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const spObjectId = context.outputs[
        OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
      ] as string | undefined;
      if (!spObjectId)
        return {
          completed: false,
          message:
            "Provisioning App's Service Principal Object ID not available to check status.",
        };
      return checkMicrosoftServicePrincipalEnabled(spObjectId);
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM2ConfigureProvisioningAppProperties(context),
    adminUrls: {
      configure: (outputs) => {
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/${appId}/isMSAApp~/false`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        return spId
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId || ""}`
          : null;
      },
    },
  },
  {
    id: "M-3",
    title: "Authorize Azure AD Provisioning to Google Workspace",
    description:
      "Configures the Azure AD provisioning app with Admin Credentials: Google's SCIM-based Tenant URL (https://www.googleapis.com/admin/directory/v1.12/scim) and the Secret Token obtained from Google Workspace in step G-S0. Tests the connection.",
    category: "Microsoft",
    automatable: true,
    requires: ["M-2", "G-S0"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      if (!context.outputs[OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN]) {
        return {
          completed: false,
          message:
            "Google Secret Token (from step G-S0) must be provided to check this step.",
        };
      }
      const spObjectId = context.outputs[
        OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
      ] as string | undefined;
      if (!spObjectId)
        return {
          completed: false,
          message:
            "Provisioning App's Service Principal Object ID not available.",
        };
      return checkMicrosoftProvisioningJobDetails(
        spObjectId,
        context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string | undefined,
      );
    },
    execute: async (context: StepContext): Promise<StepExecutionResult> => {
      if (!context.outputs[OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN]) {
        return {
          success: false,
          error: {
            message:
              "Google Secret Token (from G-S0) not provided. Cannot authorize provisioning.",
          },
        };
      }
      return executeM3AuthorizeProvisioningConnection(context);
    },
    adminUrls: {
      configure: (outputs) =>
        outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]}/objectId/${outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]}`
          : null,
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]}/objectId/${outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]}`
          : null,
    },
  },
  {
    id: "M-4",
    title: "Configure Attribute Mappings (Provisioning)",
    description:
      "Define attribute mappings for user sync from Azure AD to Google Workspace in the provisioning app (e.g., UPN to primaryEmail). This tool applies a common default set.",
    category: "Microsoft",
    automatable: true,
    requires: ["M-3"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const spObjectId = context.outputs[
        OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
      ] as string | undefined;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as
        | string
        | undefined;
      if (!spObjectId || !jobId)
        return {
          completed: false,
          message: "Provisioning App's SP Object ID or Job ID not available.",
        };
      return checkMicrosoftAttributeMappingsApplied(spObjectId, jobId);
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM4ConfigureProvisioningAttributeMappings(context),
    adminUrls: {
      configure: (outputs) =>
        outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]}/objectId/${outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]}`
          : null,
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]}/objectId/${outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]}`
          : null,
    },
  },
  {
    id: "M-5",
    title: "Define Scope & Start Provisioning Job",
    description:
      "This action starts the Azure AD provisioning job. IMPORTANT: Before starting, manually configure the provisioning scope (which users/groups to sync) in the Azure Portal for the 'Google Workspace User Provisioning' app.",
    category: "Microsoft",
    automatable: true,
    requires: ["M-4"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const spObjectId = context.outputs[
        OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
      ] as string | undefined;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as
        | string
        | undefined;
      if (!spObjectId || !jobId)
        return {
          completed: false,
          message:
            "Provisioning SP Object ID or Job ID not found for status check.",
        };
      const jobStatus = await checkMicrosoftProvisioningJobDetails(
        spObjectId,
        jobId,
      );
      if (
        jobStatus.completed &&
        jobStatus.outputs?.provisioningJobState === "Active"
      ) {
        return { completed: true, message: "Provisioning job is active." };
      }
      return {
        completed: false,
        message:
          jobStatus.message ||
          "Provisioning job is not active or status unknown.",
      };
    },
    execute: async (context: StepContext): Promise<StepExecutionResult> => {
      const result = await executeM5StartProvisioningJob(context);
      if (result.success) {
        result.message =
          (result.message ?? "") +
          " Ensure you have configured the correct provisioning scope (users/groups to sync) in the Azure portal for the Provisioning App.";
      }
      return result;
    },
    adminUrls: {
      configure: (outputs) =>
        outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]}/objectId/${outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]}`
          : null,
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${outputs[OUTPUT_KEYS.PROVISIONING_APP_ID]}/objectId/${outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]}`
          : null,
    },
  },

  // Phase 3: Azure AD - App 2 (SAML SSO)
  {
    id: "M-6",
    title: "Create Azure AD Enterprise App for SAML SSO",
    description:
      "Adds a second instance of the 'Google Cloud / G Suite Connector by Microsoft' gallery app (or a non-gallery app configured for SAML) in Azure AD. This instance will be dedicated to SAML Single Sign-On.",
    category: "SSO",
    automatable: true,
    requires: [],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as
        | string
        | undefined;
      if (!appId)
        return {
          completed: false,
          message:
            "SAML SSO App ID from a prior run must be in outputs to check.",
        };
      return checkMicrosoftServicePrincipal(appId);
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM6CreateSamlSsoApp(context),
    adminUrls: {
      configure: (outputs) => {
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/${appId}/isMSAApp~/false`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        return spId
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId || ""}`
          : null;
      },
    },
  },
  {
    id: "M-7",
    title: "Configure Azure AD SAML App for Google",
    description:
      "In the Azure AD SAML app, configure Basic SAML Settings (Identifier (Entity ID) & Reply URL (ACS URL) from Google - obtained in G-5) and ensure User Attributes & Claims are mapped correctly (e.g., NameID to UPN).",
    category: "SSO",
    automatable: true,
    requires: ["M-6", "G-5"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const appObjectId = context.outputs[
        OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID
      ] as string | undefined;
      const googleSpEntityId = context.outputs[
        OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID
      ] as string | undefined;
      const googleAcsUrl = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] as
        | string
        | undefined;
      if (!appObjectId || !googleSpEntityId || !googleAcsUrl) {
        return {
          completed: false,
          message:
            "Required IDs/URLs for SAML config check not found in outputs (from G-5 and M-6).",
        };
      }
      return checkMicrosoftSamlAppSettingsApplied(
        appObjectId,
        googleSpEntityId,
        googleAcsUrl,
      );
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM7ConfigureAzureSamlAppSettings(context),
    adminUrls: {
      configure: (outputs) => {
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/${appId}/isMSAApp~/false`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        return spId
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId || ""}`
          : null;
      },
    },
  },
  {
    id: "M-8",
    title: "Retrieve Azure AD IdP SAML Metadata for Google",
    description:
      "From the configured Azure AD SAML app, obtains its SAML Signing Certificate (Base64 encoded), Login URL (SSO Service URL), and Azure AD Identifier (IdP Entity ID). These are needed to complete SAML setup in Google Workspace.",
    category: "SSO",
    automatable: true,
    requires: ["M-7"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      return context.outputs[OUTPUT_KEYS.IDP_CERTIFICATE_BASE64] &&
        context.outputs[OUTPUT_KEYS.IDP_SSO_URL] &&
        context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID]
        ? {
            completed: true,
            message:
              "Azure AD IdP SAML metadata is present in this tool's outputs.",
          }
        : {
            completed: false,
            message:
              "Azure AD IdP SAML metadata not yet retrieved by this tool.",
          };
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM8RetrieveAzureIdpMetadata(context),
    adminUrls: {
      configure: (outputs) => {
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/${appId}/isMSAApp~/false`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        return spId
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId || ""}`
          : null;
      },
    },
  },

  // Phase 4: Finalize SSO in Google Workspace
  {
    id: "G-6",
    title: "Update Google SAML Profile with Azure AD IdP Info",
    description:
      "Update the Google Workspace 'Azure AD SSO' SAML profile with the IdP metadata (Login URL, Entity ID, Certificate) retrieved from Azure AD (in step M-8) and enable the profile.",
    category: "SSO",
    automatable: true,
    requires: ["G-5", "M-8"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const profileFullName = context.outputs[
        OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
      ] as string | undefined;
      const expectedIdpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as
        | string
        | undefined;
      if (!profileFullName)
        return {
          completed: false,
          message:
            "Google SAML Profile name (from G-5) not found to check configuration.",
        };
      if (!expectedIdpEntityId)
        return {
          completed: false,
          message:
            "Expected Azure AD IdP Entity ID (from M-8) not found in outputs.",
        };
      return checkGoogleSamlProfileDetails(
        profileFullName,
        false,
        expectedIdpEntityId,
      );
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeG6UpdateGoogleSamlWithAzureIdp(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/sso",
      verify: "https://admin.google.com/ac/sso",
    },
  },
  {
    id: "G-7",
    title: "Assign Google SAML Profile to Users/OUs",
    description:
      "Activate the 'Azure AD SSO' SAML profile for users in Google Workspace. This tool assigns it to the Root OU by default. Adjust in Google Admin console if specific OUs/Groups are required.",
    category: "SSO",
    automatable: true,
    requires: ["G-6"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const profileFullName = context.outputs[
        OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
      ] as string | undefined;
      if (!profileFullName)
        return {
          completed: false,
          message: "Google SAML Profile name not found.",
        };
      const profileDetailsCheck = await checkGoogleSamlProfileDetails(
        profileFullName,
        false,
        undefined,
      );
      if (
        profileDetailsCheck.completed &&
        profileDetailsCheck.outputs?.ssoMode === "SAML_SSO_ENABLED"
      ) {
        // This check confirms the profile is enabled. A more specific check would verify actual OU assignment.
        return {
          completed: true,
          message:
            "Google SAML Profile is enabled. Assignment to Root OU is applied by execute action.",
        };
      }
      return {
        completed: false,
        message:
          "Google SAML profile not enabled or assignment status unknown. Run/re-run to assign to Root OU.",
      };
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeG7AssignGoogleSamlToRootOu(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/sso",
      verify: "https://admin.google.com/ac/sso",
    },
  },
  {
    id: "G-8",
    title: "Exclude Automation OU from SSO (Optional)",
    description:
      "If an 'Automation' OU exists (from G-1), ensures SAML SSO is explicitly disabled for that OU. This allows any accounts within it (e.g., specific service accounts) to log in directly with Google credentials, bypassing Azure AD SSO.",
    category: "SSO",
    automatable: true,
    requires: ["G-1", "G-7"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const automationOuId = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_ID] as
        | string
        | undefined;
      if (!automationOuId)
        return {
          completed: true,
          message:
            "Automation OU not configured or ID missing; this step is effectively skipped.",
        };
      // A specific check for an OU's SAML settings being "SSO_OFF" is complex.
      // We rely on re-execution to ensure this state.
      return {
        completed: false,
        message:
          "Run/re-run to ensure SAML is disabled for Automation OU (if it exists).",
      };
    },
    execute: async (context: StepContext): Promise<StepExecutionResult> => {
      const automationOuId = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_ID] as
        | string
        | undefined;
      if (!automationOuId)
        return {
          success: true,
          message:
            "Automation OU ID not found, skipping SSO disable for it as OU does not exist or was not created by this tool.",
        };
      return executeG8ExcludeAutomationOuFromSso(context);
    },
    adminUrls: {
      configure: "https://admin.google.com/ac/sso",
      verify: "https://admin.google.com/ac/sso",
    },
  },

  // Phase 5: Azure AD - Finalize SSO App
  {
    id: "M-9",
    title: "Assign Users/Groups to Azure AD SSO App",
    description:
      "In Azure AD, assign the relevant users or groups to the Google Workspace SAML SSO application to grant them access to sign in via Azure AD. This tool provides a link to the Azure portal page for manual assignment.",
    category: "SSO",
    automatable: true, // The action provides a link; actual assignment is manual in Azure.
    requires: ["M-6"],
    check: async (context: StepContext): Promise<StepCheckResult> => {
      const ssoSpObjectId = context.outputs[
        OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID
      ] as string | undefined;
      if (!ssoSpObjectId)
        return {
          completed: false,
          message:
            "Azure SAML SSO App SP Object ID not found to check assignments.",
        };
      return checkMicrosoftAppAssignments(ssoSpObjectId);
    },
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM9AssignUsersToAzureSsoApp(context),
    adminUrls: {
      configure: (outputs) =>
        outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.SAML_SSO_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/${outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]}/appId/${outputs[OUTPUT_KEYS.SAML_SSO_APP_ID]}`
          : null,
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] && outputs[OUTPUT_KEYS.SAML_SSO_APP_ID]
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/${outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]}/appId/${outputs[OUTPUT_KEYS.SAML_SSO_APP_ID]}`
          : null,
    },
  },

  // Phase 6: Testing
  {
    id: "M-10",
    title: "Test & Validate SSO Sign-in",
    description:
      "Manual: Test the complete SAML SSO flow by attempting to log into a Google service with an Azure AD user account that has been provisioned (if applicable) and assigned to the SSO app in Azure AD.",
    category: "SSO",
    automatable: false,
    requires: ["G-7", "M-9"],
    check: async (_context: StepContext): Promise<StepCheckResult> => ({
      completed: false,
      message:
        "Manual verification by administrator is required for SSO testing.",
    }),
    execute: async (_context: StepContext): Promise<StepExecutionResult> => ({
      success: true,
      message:
        "Test SSO: \n1. Open a new Incognito/Private browser window. \n2. Navigate to a Google service (e.g., mail.google.com for Workspace, or console.cloud.google.com for GCP). \n3. When prompted for login, enter the full email address (UPN) of an Azure AD user assigned to the SAML SSO application in Azure AD (and ideally provisioned to Google Workspace). \n4. You should be redirected to Azure AD for login. \n5. After successful Azure AD login, you should be redirected back and logged into the Google service. \nVerify access and correct user identity.",
      resourceUrl: "https://myapps.microsoft.com",
    }),
    adminUrls: {
      configure: "https://myapps.microsoft.com",
      verify: "https://myapps.microsoft.com",
    },
  },
];

/**
 * Quick lookup map for step definitions by ID.
 * Useful when resolving dependencies or executing actions.
 */
export const stepDefinitionMap = new Map<string, StepDefinition>(
  allStepDefinitions.map((def) => [def.id, def]),
);

/**
 * Look up check and execute implementations for a step.
 * Returns undefined if the step ID is not defined.
 */
export function getStepActions(stepId: string):
  | {
      check?: (context: StepContext) => Promise<StepCheckResult>;
      execute: (context: StepContext) => Promise<StepExecutionResult>;
    }
  | undefined {
  const step = allStepDefinitions.find((s) => s.id === stepId);
  if (!step) return undefined;
  return { check: step.check, execute: step.execute };
}
