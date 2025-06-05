// This file contains the enhanced descriptions, details, and metadata for all steps
import { STEP_IDS } from "@/lib/steps/step-refs";
import type { StepId } from "./step-refs";

export interface StepContent {
  details: string;
  actions: string[];
  nextStep?: { id: StepId; description: string };
}

export const stepContentEnhancements: Record<StepId, StepContent> = {
  [STEP_IDS.CREATE_AUTOMATION_OU]: {
    details:
      "Creates an organizational unit at the root level of your Google Workspace directory. This OU will contain service accounts and other automation-related users, keeping them separate from regular users for security and organization.",
    actions: ["POST /admin/directory/v1/customer/{customerId}/orgunits"],
    nextStep: {
      id: STEP_IDS.CREATE_PROVISIONING_USER,
      description: "Create a dedicated provisioning user in the Automation OU",
    },
  },
  [STEP_IDS.CREATE_PROVISIONING_USER]: {
    details:
      "Creates a service account user (azuread-provisioning@domain) within the Automation OU. This account will be used by Azure AD to authenticate and sync users to Google Workspace via OAuth.",
    actions: ["POST /admin/directory/v1/users"],
    nextStep: {
      id: STEP_IDS.GRANT_SUPER_ADMIN,
      description: "Grant admin privileges to the provisioning user",
    },
  },
  [STEP_IDS.GRANT_SUPER_ADMIN]: {
    details:
      "Assigns Super Admin role to the provisioning user, granting full access to manage users, groups, and organizational units. This is required for Azure AD to perform provisioning operations.",
    actions: ["POST /admin/directory/v1/customer/{customerId}/roleassignments"],
    nextStep: {
      id: STEP_IDS.VERIFY_DOMAIN,
      description: "Verify your domain for federation",
    },
  },
  [STEP_IDS.VERIFY_DOMAIN]: {
    details:
      "Adds the primary domain to Google Workspace and verifies ownership via DNS. Federation requires a verified domain so that Google trusts sign-in requests from Microsoft.",
    actions: ["POST /admin/directory/v1/customer/{customerId}/domains"],
    nextStep: {
      id: STEP_IDS.INITIATE_SAML_PROFILE,
      description: "Create the SAML SSO profile",
    },
  },
  [STEP_IDS.INITIATE_SAML_PROFILE]: {
    details:
      "Creates a new inbound SAML profile in Google Workspace and returns the Service Provider entity ID and ACS URL. Microsoft uses these values when configuring SSO.",
    actions: ["POST /v1/inboundSamlSsoProfiles"],
    nextStep: {
      id: STEP_IDS.UPDATE_SAML_PROFILE,
      description: "Update the SAML profile with IdP info",
    },
  },
  [STEP_IDS.UPDATE_SAML_PROFILE]: {
    details:
      "Updates the SAML profile with metadata from Azure AD including entity ID, SSO URL, and certificate. This completes the trust configuration for single sign-on.",
    actions: ["PATCH /v1/inboundSamlSsoProfiles/{profile}"],
    nextStep: {
      id: STEP_IDS.ASSIGN_SAML_PROFILE,
      description: "Assign the SAML profile",
    },
  },
  [STEP_IDS.ASSIGN_SAML_PROFILE]: {
    details:
      "Assigns the configured SAML profile to organizational units or groups so users are redirected to Microsoft for authentication.",
    actions: ["POST /v1/inboundSamlSsoProfiles/{profile}:assignToOrgUnits"],
    nextStep: {
      id: STEP_IDS.EXCLUDE_AUTOMATION_OU,
      description: "Exclude Automation OU from SSO",
    },
  },
  [STEP_IDS.EXCLUDE_AUTOMATION_OU]: {
    details:
      "Optionally removes the Automation OU from the assigned SAML profile so service accounts continue using Google sign-in instead of SSO.",
    actions: [
      "PATCH /v1/inboundSamlSsoProfiles/{profile}:unassignFromOrgUnits",
    ],
    nextStep: undefined,
  },
  [STEP_IDS.CREATE_PROVISIONING_APP]: {
    details:
      "Instantiates the Google Cloud/G Suite Connector by Microsoft gallery app in Azure AD. This creates both an application registration and a service principal for provisioning.",
    actions: ["POST /applicationTemplates/{templateId}/instantiate"],
    nextStep: {
      id: STEP_IDS.ENABLE_PROVISIONING_SP,
      description: "Enable the service principal",
    },
  },
  [STEP_IDS.ENABLE_PROVISIONING_SP]: {
    details:
      "Enables the newly created service principal so it can be configured with credentials and permissions.",
    actions: ["PATCH /servicePrincipals/{id}"],
    nextStep: {
      id: STEP_IDS.AUTHORIZE_PROVISIONING,
      description: "Authorize provisioning using Google admin",
    },
  },
  [STEP_IDS.AUTHORIZE_PROVISIONING]: {
    details:
      "Manually authorize Azure AD to manage Google Workspace by signing in with the dedicated provisioning user. This OAuth consent grants provisioning permissions.",
    actions: [
      "Manual: Click 'Authorize' in Azure",
      "Manual: Sign in with provisioning user",
      "Manual: Complete OAuth consent",
      "Manual: Test connection",
    ],
    nextStep: {
      id: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
      description: "Configure how user attributes map between systems",
    },
  },
  [STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS]: {
    details:
      "Configures attribute mappings so Azure AD fields sync correctly to Google Workspace. Adjust mappings for usernames, addresses, and group membership.",
    actions: ["Manual: Configure attribute mappings in portal"],
    nextStep: {
      id: STEP_IDS.START_PROVISIONING,
      description: "Start synchronization job",
    },
  },
  [STEP_IDS.START_PROVISIONING]: {
    details:
      "Defines the provisioning scope and starts the synchronization job. Azure AD begins syncing users and groups to Google Workspace.",
    actions: ["POST /servicePrincipals/{id}/synchronization/jobs"],
    nextStep: {
      id: STEP_IDS.CREATE_SAML_APP,
      description: "Create SAML app for SSO",
    },
  },
  [STEP_IDS.CREATE_SAML_APP]: {
    details:
      "Creates a second gallery application specifically for SAML single sign-on with Google Workspace. Generates a new service principal and app registration.",
    actions: ["POST /applicationTemplates/{templateId}/instantiate"],
    nextStep: {
      id: STEP_IDS.CONFIGURE_SAML_APP,
      description: "Configure SAML settings",
    },
  },
  [STEP_IDS.CONFIGURE_SAML_APP]: {
    details:
      "Updates the SAML application with Google's ACS URL and entity ID. Also uploads the Azure AD certificate used for signing assertions.",
    actions: ["Manual: Enter SAML settings in portal"],
    nextStep: {
      id: STEP_IDS.RETRIEVE_IDP_METADATA,
      description: "Retrieve IdP metadata",
    },
  },
  [STEP_IDS.RETRIEVE_IDP_METADATA]: {
    details:
      "Retrieves the Azure AD SAML metadata XML which includes the IdP entity ID, login URL, and certificate. Google needs this data to trust Azure AD.",
    actions: ["GET /federationmetadata/2007-06/federationmetadata.xml"],
    nextStep: {
      id: STEP_IDS.ASSIGN_USERS_SSO,
      description: "Assign users to SSO app",
    },
  },
  [STEP_IDS.ASSIGN_USERS_SSO]: {
    details:
      "Assigns users or groups to the SSO application so they can sign in to Google via Azure AD.",
    actions: ["Manual: Add user or group assignments"],
    nextStep: { id: STEP_IDS.TEST_SSO, description: "Test sign-in" },
  },
  [STEP_IDS.TEST_SSO]: {
    details:
      "Tests the entire single sign-on flow using an assigned user account to confirm that authentication works as expected.",
    actions: ["Manual: Use 'Test' button in portal"],
    nextStep: undefined,
  },
} as const;
