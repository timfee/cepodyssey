import {
  executeG1CreateAutomationOu,
  executeG2CreateServiceAccount,
  executeG3GrantAdminPrivileges,
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeG1CreateAutomationOu(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/orgunits",
      verify: "https://admin.google.com/ac/orgunits",
    },
  },
  {
    id: "G-2",
    title: "Create Service Account in Automation OU",
    description:
      "Creates a dedicated service account user in the Automation OU for administrative operations. This account can be used for API access and automated tasks.",
    category: "Google",
    automatable: true,
    requires: ["G-1"],
    execute: async (context: StepContext): Promise<StepExecutionResult> =>
      executeG2CreateServiceAccount(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/users",
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
          ? `https://admin.google.com/ac/users/${outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]}`
          : null,
    },
  },
  {
    id: "G-3",
    title: "Grant Service Account Admin Privileges",
    description:
      "Assigns Super Admin role to the service account, enabling it to perform all administrative operations in Google Workspace.",
    category: "Google",
    automatable: true,
    requires: ["G-2"],
    execute: async (context: StepContext): Promise<StepExecutionResult> =>
      executeG3GrantAdminPrivileges(context),
    adminUrls: {
      configure: "https://admin.google.com/ac/roles",
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
          ? `https://admin.google.com/ac/users/${outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]}`
          : null,
    },
  },
  {
    id: "G-S0",
    title: "Get Google Secret Token for User Provisioning",
    description:
      "Manual: Enable 'Automated user provisioning' in Google Workspace Admin console and copy the generated OAuth Bearer Token (Secret Token). This token is required by Azure AD to provision users into your Google Workspace. Input this token when prompted by this tool.",
    category: "Google",
    automatable: false,
    requires: ["G-3"],
    execute: async (_context: StepContext): Promise<StepExecutionResult> => ({
      success: true,
      message:
        "To get the Google Secret Token for provisioning:\n\n" +
        "1. Sign in to Google Admin Console (admin.google.com)\n" +
        "2. Navigate to: Apps > Web and mobile apps\n" +
        "3. Click 'Add app' > 'Add custom SAML app'\n" +
        "4. Enter a temporary name (e.g., 'Azure AD Provisioning Setup')\n" +
        "5. On 'Google Identity Provider details', click 'Continue'\n" +
        "6. On 'Service provider details', click 'Continue'\n" +
        "7. On 'Attribute mapping', click 'Continue'\n" +
        "8. On the final page, look for 'Automatic user provisioning' section\n" +
        "9. Click 'SET UP AUTOMATIC USER PROVISIONING'\n" +
        "10. Copy the 'Authorization token' value - this is your Secret Token\n" +
        "11. Save this token securely - you'll need it for step M-3\n\n" +
        "Note: The app you create here is temporary. The actual SSO will be configured later.",
      resourceUrl: "https://admin.google.com/ac/apps/unified",
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
    requires: ["G-3"],
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM1CreateProvisioningApp(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`;
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM2ConfigureProvisioningAppProperties(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`;
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
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`;
      },
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM4ConfigureProvisioningAttributeMappings(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`;
      },
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
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`;
      },
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM6CreateSamlSsoApp(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`;
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM7ConfigureAzureSamlAppSettings(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`;
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM8RetrieveAzureIdpMetadata(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`;
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
    execute: (context: StepContext): Promise<StepExecutionResult> =>
      executeM9AssignUsersToAzureSsoApp(context),
    adminUrls: {
      configure: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/${spId}/appId/${appId}`;
      },
      verify: (outputs) => {
        const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
        const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
        if (!spId || !appId) return null;
        return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/${spId}/appId/${appId}`;
      },
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
      execute: (context: StepContext) => Promise<StepExecutionResult>;
    }
  | undefined {
  const step = allStepDefinitions.find((s) => s.id === stepId);
  if (!step) return undefined;
  return { execute: step.execute };
}
