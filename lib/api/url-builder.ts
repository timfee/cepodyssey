/**
 * Centralized URL builder for all external service URLs.
 * Handles proper encoding and uses environment variables.
 */

// API Base URLs (from env)
export const API_BASES = {
  googleDirectory:
    process.env.GOOGLE_API_BASE || "https://admin.googleapis.com",
  googleIdentity:
    process.env.GOOGLE_IDENTITY_BASE || "https://cloudidentity.googleapis.com",
  microsoftGraph:
    process.env.GRAPH_API_BASE || "https://graph.microsoft.com/v1.0",
  googleOAuth: process.env.GOOGLE_OAUTH_BASE || "https://oauth2.googleapis.com",
  microsoftLogin:
    process.env.MICROSOFT_LOGIN_BASE || "https://login.microsoftonline.com",
} as const;

// UI/Portal Base URLs (from env)
export const PORTAL_BASES = {
  googleAdmin:
    process.env.GOOGLE_ADMIN_CONSOLE_BASE || "https://admin.google.com",
  azurePortal: process.env.AZURE_PORTAL_BASE || "https://portal.azure.com",
} as const;

// Google Directory API URLs
export const googleDirectoryUrls = {
  base: () => `${API_BASES.googleDirectory}/admin/directory/v1`,

  orgUnits: {
    list: (customerId: string) =>
      `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/orgunits?type=all`,
    create: (customerId: string) =>
      `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/orgunits`,
    get: (customerId: string, ouPath: string) => {
      const relativePath = ouPath.startsWith("/")
        ? ouPath.substring(1)
        : ouPath;
      return `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/orgunits/${encodeURIComponent(relativePath)}`;
    },
  },

  users: {
    list: (params?: {
      domain?: string;
      query?: string;
      orderBy?: string;
      maxResults?: number;
    }) => {
      const url = new URL(`${googleDirectoryUrls.base()}/users`);
      if (params?.domain) url.searchParams.append("domain", params.domain);
      if (params?.query) url.searchParams.append("query", params.query);
      if (params?.orderBy) url.searchParams.append("orderBy", params.orderBy);
      if (params?.maxResults)
        url.searchParams.append("maxResults", params.maxResults.toString());
      return url.toString();
    },
    get: (userKey: string) =>
      `${googleDirectoryUrls.base()}/users/${encodeURIComponent(userKey)}?fields=isAdmin,suspended,primaryEmail,name,id,orgUnitPath,customerId`,
    create: () => `${googleDirectoryUrls.base()}/users`,
  },

  domains: {
    list: (customerId: string) =>
      `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/domains`,
    get: (customerId: string, domainName: string) =>
      `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/domains/${encodeURIComponent(domainName)}`,
    create: (customerId: string) =>
      `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/domains`,
  },

  roles: {
    list: (customerId: string) =>
      `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/roles`,
    assignments: {
      list: (customerId: string, userKey: string) =>
        `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/roleassignments?userKey=${encodeURIComponent(userKey)}`,
      create: (customerId: string) =>
        `${googleDirectoryUrls.base()}/customer/${encodeURIComponent(customerId)}/roleassignments`,
    },
  },
};

// Google Cloud Identity API URLs
export const googleIdentityUrls = {
  base: () => `${API_BASES.googleIdentity}/v1`,

  samlProfiles: {
    list: () => `${googleIdentityUrls.base()}/inboundSamlSsoProfiles`,
    get: (profileFullName: string) =>
      `${googleIdentityUrls.base()}/${profileFullName}`,
    create: () => `${googleIdentityUrls.base()}/inboundSamlSsoProfiles`,
    update: (profileFullName: string, updateMask?: string) => {
      const url = new URL(`${googleIdentityUrls.base()}/${profileFullName}`);
      if (updateMask) url.searchParams.append("updateMask", updateMask);
      return url.toString();
    },
    assignToOrgUnits: (profileFullName: string) =>
      `${googleIdentityUrls.base()}/${profileFullName}:assignToOrgUnits`,
    idpCredentials: {
      list: (profileFullName: string) =>
        `${googleIdentityUrls.base()}/${profileFullName}/idpCredentials`,
      add: (profileFullName: string) =>
        `${googleIdentityUrls.base()}/${profileFullName}/idpCredentials:add`,
    },
  },
};

// Microsoft Graph API URLs
export const microsoftGraphUrls = {
  base: () => API_BASES.microsoftGraph,

  applications: {
    list: (filter?: string) => {
      const url = new URL(`${microsoftGraphUrls.base()}/applications`);
      if (filter) url.searchParams.append("$filter", filter);
      return url.toString();
    },
    get: (appObjectId: string) =>
      `${microsoftGraphUrls.base()}/applications/${appObjectId}?$select=id,appId,displayName,identifierUris,web`,
    update: (appObjectId: string) =>
      `${microsoftGraphUrls.base()}/applications/${appObjectId}`,
  },

  servicePrincipals: {
    list: (filter?: string) => {
      const url = new URL(`${microsoftGraphUrls.base()}/servicePrincipals`);
      if (filter) url.searchParams.append("$filter", filter);
      url.searchParams.append(
        "$select",
        "id,appId,displayName,accountEnabled,appOwnerOrganizationId",
      );
      return url.toString();
    },
    get: (spObjectId: string) =>
      `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}?$select=id,appId,displayName,accountEnabled`,
    update: (spObjectId: string) =>
      `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}`,
    appRoleAssignments: {
      list: (spObjectId: string) =>
        `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/appRoleAssignedTo`,
      create: (spObjectId: string) =>
        `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/appRoleAssignedTo`,
    },
    synchronization: {
      jobs: {
        list: (spObjectId: string) =>
          `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/synchronization/jobs`,
        get: (spObjectId: string, jobId: string) =>
          `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/synchronization/jobs/${jobId}`,
        create: (spObjectId: string) =>
          `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/synchronization/jobs`,
        start: (spObjectId: string, jobId: string) =>
          `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/synchronization/jobs/${jobId}/start`,
        schema: (spObjectId: string, jobId: string) =>
          `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/synchronization/jobs/${jobId}/schema`,
      },
      secrets: (spObjectId: string) =>
        `${microsoftGraphUrls.base()}/servicePrincipals/${spObjectId}/synchronization/secrets`,
    },
  },

  applicationTemplates: {
    instantiate: (templateId: string) =>
      `${microsoftGraphUrls.base()}/applicationTemplates/${templateId}/instantiate`,
  },

  me: {
    memberOf: () =>
      `${microsoftGraphUrls.base()}/me/memberOf/microsoft.graph.directoryRole?$select=displayName,roleTemplateId`,
  },
};

// Microsoft Auth URLs
export const microsoftAuthUrls = {
  token: (tenantId: string) =>
    `${API_BASES.microsoftLogin}/${tenantId}/oauth2/v2.0/token`,
  openIdConfig: (domain: string) =>
    `${API_BASES.microsoftLogin}/${domain}/.well-known/openid-configuration`,
  samlMetadata: (tenantId: string, appId: string) =>
    `${API_BASES.microsoftLogin}/${tenantId}/federationmetadata/2007-06/federationmetadata.xml?appid=${appId}`,
};

// Google OAuth URLs
export const googleOAuthUrls = {
  token: () => `${API_BASES.googleOAuth}/token`,
};

// Portal/Console URLs for UI navigation
export const portalUrls = {
  google: {
    orgUnits: {
      list: () => `${PORTAL_BASES.googleAdmin}/ac/orgunits`,
      /**
       * Return the Admin Console URL for a given org unit reference.
       * Accepts either an orgUnitId (prefixed with "id:") or an org unit path.
       */
      details: (ouRef: string) => {
        if (ouRef.startsWith("id:")) {
          return `${PORTAL_BASES.googleAdmin}/ac/orgunits/details?ouid=${encodeURIComponent(ouRef)}`;
        }
        return `${PORTAL_BASES.googleAdmin}/ac/orgunits/details?ouPath=${encodeURIComponent(ouRef)}`;
      },
    },
    users: {
      list: () => `${PORTAL_BASES.googleAdmin}/ac/users`,
      details: (userEmail: string) =>
        `${PORTAL_BASES.googleAdmin}/ac/users/${encodeURIComponent(userEmail)}`,
    },
    domains: {
      manage: (domain?: string) => {
        const url = new URL(`${PORTAL_BASES.googleAdmin}/ac/domains/manage`);
        if (domain) url.searchParams.append("domain", domain);
        return url.toString();
      },
    },
    sso: {
      main: () => `${PORTAL_BASES.googleAdmin}/ac/sso`,
      samlProfile: (profileFullName: string) => {
        // Extract profile ID and properly encode for the Admin Console URL
        const profileId = profileFullName.split("/").pop();
        if (!profileId) return portalUrls.google.sso.main();

        // The Admin Console expects the profile reference in a specific format
        // with forward slashes encoded as %2F
        const encodedProfileRef = `inboundSamlSsoProfiles${encodeURIComponent("/" + profileId)}`;
        return `${PORTAL_BASES.googleAdmin}/ac/security/sso/sso-profiles/${encodedProfileRef}`;
      },
    },
  },

  azure: {
    enterpriseApp: {
      overview: (spId: string, appId: string) =>
        `${PORTAL_BASES.azurePortal}/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/${spId}/appId/${appId}`,
      provisioning: (spId: string, appId: string) =>
        `${PORTAL_BASES.azurePortal}/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}/objectId/${spId}`,
      singleSignOn: (spId: string, appId: string) =>
        `${PORTAL_BASES.azurePortal}/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`,
      usersAndGroups: (spId: string, appId: string) =>
        `${PORTAL_BASES.azurePortal}/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/${spId}/appId/${appId}`,
    },
    myApps: () => "https://myapps.microsoft.com",
  },
};
