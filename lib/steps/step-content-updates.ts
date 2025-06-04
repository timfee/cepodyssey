// This file contains the enhanced descriptions, details, and metadata for all steps
export const stepContentEnhancements = {
  "G-1": {
    details:
      "Creates an organizational unit at the root level of your Google Workspace directory. This OU will contain service accounts and other automation-related users, keeping them separate from regular users for security and organization.",
    actions: ["POST /admin/directory/v1/customer/{customerId}/orgunits"],
    nextStep: {
      id: "G-2",
      description: "Create a dedicated provisioning user in the Automation OU",
    },
  },
  "G-2": {
    details:
      "Creates a service account user (azuread-provisioning@domain) within the Automation OU. This account will be used by Azure AD to authenticate and sync users to Google Workspace via OAuth.",
    actions: ["POST /admin/directory/v1/users"],
    nextStep: {
      id: "G-3",
      description: "Grant admin privileges to the provisioning user",
    },
  },
  "G-3": {
    details:
      "Assigns Super Admin role to the provisioning user, granting full access to manage users, groups, and organizational units. This is required for Azure AD to perform provisioning operations.",
    actions: ["POST /admin/directory/v1/customer/{customerId}/roleassignments"],
    nextStep: {
      id: "G-4",
      description: "Verify your domain for federation",
    },
  },
  "G-4": {
    details:
      "Adds the primary domain to Google Workspace and verifies ownership via DNS. Federation requires a verified domain so that Google trusts sign-in requests from Microsoft.",
    actions: ["POST /admin/directory/v1/customer/{customerId}/domains"],
    nextStep: {
      id: "G-5",
      description: "Create the SAML SSO profile",
    },
  },
  "G-5": {
    details:
      "Creates a new inbound SAML profile in Google Workspace and returns the Service Provider entity ID and ACS URL. Microsoft uses these values when configuring SSO.",
    actions: ["POST /v1/inboundSamlSsoProfiles"],
    nextStep: {
      id: "G-6",
      description: "Update the SAML profile with IdP info",
    },
  },
  "G-6": {
    details:
      "Updates the SAML profile with metadata from Azure AD including entity ID, SSO URL, and certificate. This completes the trust configuration for single sign-on.",
    actions: ["PATCH /v1/inboundSamlSsoProfiles/{profile}"],
    nextStep: { id: "G-7", description: "Assign the SAML profile" },
  },
  "G-7": {
    details:
      "Assigns the configured SAML profile to organizational units or groups so users are redirected to Microsoft for authentication.",
    actions: ["POST /v1/inboundSamlSsoProfiles/{profile}:assignToOrgUnits"],
    nextStep: { id: "G-8", description: "Exclude Automation OU from SSO" },
  },
  "G-8": {
    details:
      "Optionally removes the Automation OU from the assigned SAML profile so service accounts continue using Google sign-in instead of SSO.",
    actions: [
      "PATCH /v1/inboundSamlSsoProfiles/{profile}:unassignFromOrgUnits",
    ],
    nextStep: undefined,
  },
  "M-1": {
    details:
      "Instantiates the Google Cloud/G Suite Connector by Microsoft gallery app in Azure AD. This creates both an application registration and a service principal for provisioning.",
    actions: ["POST /applicationTemplates/{templateId}/instantiate"],
    nextStep: { id: "M-2", description: "Enable the service principal" },
  },
  "M-2": {
    details:
      "Enables the newly created service principal so it can be configured with credentials and permissions.",
    actions: ["PATCH /servicePrincipals/{id}"],
    nextStep: {
      id: "M-3",
      description: "Authorize provisioning using Google admin",
    },
  },
  "M-3": {
    details:
      "Manually authorize Azure AD to manage Google Workspace by signing in with the dedicated provisioning user. This OAuth consent grants provisioning permissions.",
    actions: [
      "Manual: Click 'Authorize' in Azure",
      "Manual: Sign in with provisioning user",
      "Manual: Complete OAuth consent",
      "Manual: Test connection",
    ],
    nextStep: {
      id: "M-4",
      description: "Configure how user attributes map between systems",
    },
  },
  "M-4": {
    details:
      "Configures attribute mappings so Azure AD fields sync correctly to Google Workspace. Adjust mappings for usernames, addresses, and group membership.",
    actions: ["Manual: Configure attribute mappings in portal"],
    nextStep: { id: "M-5", description: "Start synchronization job" },
  },
  "M-5": {
    details:
      "Defines the provisioning scope and starts the synchronization job. Azure AD begins syncing users and groups to Google Workspace.",
    actions: ["POST /servicePrincipals/{id}/synchronization/jobs"],
    nextStep: { id: "M-6", description: "Create SAML app for SSO" },
  },
  "M-6": {
    details:
      "Creates a second gallery application specifically for SAML single sign-on with Google Workspace. Generates a new service principal and app registration.",
    actions: ["POST /applicationTemplates/{templateId}/instantiate"],
    nextStep: { id: "M-7", description: "Configure SAML settings" },
  },
  "M-7": {
    details:
      "Updates the SAML application with Google's ACS URL and entity ID. Also uploads the Azure AD certificate used for signing assertions.",
    actions: ["Manual: Enter SAML settings in portal"],
    nextStep: { id: "M-8", description: "Retrieve IdP metadata" },
  },
  "M-8": {
    details:
      "Retrieves the Azure AD SAML metadata XML which includes the IdP entity ID, login URL, and certificate. Google needs this data to trust Azure AD.",
    actions: ["GET /federationmetadata/2007-06/federationmetadata.xml"],
    nextStep: { id: "M-9", description: "Assign users to SSO app" },
  },
  "M-9": {
    details:
      "Assigns users or groups to the SSO application so they can sign in to Google via Azure AD.",
    actions: ["Manual: Add user or group assignments"],
    nextStep: { id: "M-10", description: "Test sign-in" },
  },
  "M-10": {
    details:
      "Tests the entire single sign-on flow using an assigned user account to confirm that authentication works as expected.",
    actions: ["Manual: Use 'Test' button in portal"],
    nextStep: undefined,
  },
} as const;
