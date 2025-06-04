import type { StepDefinition } from "./types";
import { OUTPUT_KEYS } from "./types";

/**
 * Declarative list of all automation steps in execution order.
 * Each definition contains metadata only. Execution and check
 * logic resides in server-side actions.
 */
export const allStepDefinitions: StepDefinition[] = [
  // Phase 1: Initial Google Workspace Setup
  {
    id: "G-4",
    title: "Add & Verify Domain for Federation",
    description:
      "Ensures the primary domain you intend to federate with Azure AD (as configured in this tool) is added and verified within your Google Workspace account. This is essential for SAML-based Single Sign-On.",
    category: "Google",
    automatable: true,
    requires: [],
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
    adminUrls: {
      configure: "https://admin.google.com/ac/sso",
      verify: "https://admin.google.com/ac/sso",
    },
  },
  {
    id: "G-S0",
    title: "Enable Provisioning on SAML Profile",
    description:
      "Enables automatic user provisioning on the Azure AD SAML profile created in G-5. This requires copying a token from Google Admin Console.",
    category: "Google",
    automatable: false,
    requires: ["G-5"],
    adminUrls: {
      configure: (outputs) => {
        const profileName = outputs[
          OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
        ] as string;
        const profileId = profileName?.split("/").pop();
        return profileId
          ? `https://admin.google.com/ac/security/sso/sso-profiles/inboundSamlSsoProfiles%2F${profileId}`
          : "https://admin.google.com/ac/security/sso";
      },
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
    adminUrls: {
      configure: "https://admin.google.com/ac/sso",
      verify: "https://admin.google.com/ac/sso",
    },
  },
  {
    id: "G-8",
    title: "Exclude Automation OU from SSO (Optional)",
    description:
      "If an 'Automation' OU exists (from manual creation), ensures SAML SSO is explicitly disabled for that OU. This allows any accounts within it to log in directly with Google credentials, bypassing Azure AD SSO.",
    category: "SSO",
    automatable: true,
    requires: ["G-7"],
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
  allStepDefinitions.map((def) => [def.id, def])
);
