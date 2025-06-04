import type { admin_directory_v1 } from "googleapis";

import { APIError, fetchWithAuth, handleApiResponse } from "./utils";
import { wrapAuthError } from "./auth-interceptor";
import { isAPIEnablementError, createEnablementError } from "./api-enablement-error";

export type DirectoryUser = admin_directory_v1.Schema$User;
export type GoogleOrgUnit = admin_directory_v1.Schema$OrgUnit;
export type GoogleRole = admin_directory_v1.Schema$Role;
export type GoogleRoleAssignment = admin_directory_v1.Schema$RoleAssignment;
export type GoogleDomain = admin_directory_v1.Schema$Domains & {
  verified?: boolean;
};
export type GoogleDomains = admin_directory_v1.Schema$Domains;

export interface InboundSamlSsoProfile {
  name?: string;
  customer?: string;
  displayName?: string;
  idpConfig?: {
    entityId?: string;
    singleSignOnServiceUri?: string;
    logoutRedirectUri?: string;
    changePasswordUri?: string;
  };
  spConfig?: {
    entityId?: string;
    assertionConsumerServiceUri?: string;
  };
}

export interface SsoAssignment {
  orgUnitId: string;
  ssoMode: "SSO_OFF" | "SAML_SSO_ENABLED" | "SSO_INHERITED";
}

export interface IdpCredential {
  name?: string;
  updateTime?: string;
  rsaKeyInfo?: {
    keySize?: number;
  };
  dsaKeyInfo?: {
    keySize?: number;
  };
}

const GWS_CUSTOMER_ID = "my_customer";

/** Build the base URL for Directory API calls. */
function getDirectoryApiBaseUrl(): string {
  const envBase = process.env.GOOGLE_API_BASE;
  if (!envBase) {
    console.error("CRITICAL: GOOGLE_API_BASE environment variable is not set!");
    throw new Error("Google API base URL is not configured.");
  }
  return `${envBase}/admin/directory/v1`;
}

/** Build the base URL for Cloud Identity API calls. */
function getCloudIdentityApiBaseUrl(): string {
  const envBase = process.env.GOOGLE_IDENTITY_BASE;
  if (!envBase) {
    console.error(
      "CRITICAL: GOOGLE_IDENTITY_BASE environment variable is not set!",
    );
    throw new Error("Google Cloud Identity API base URL is not configured.");
  }
  return `${envBase}/v1`;
}

function handleGoogleError(error: unknown): never {
  if (
    error instanceof APIError &&
    (error.status === 401 ||
      error.message?.includes("invalid authentication credentials"))
  ) {
    throw wrapAuthError(error, "google");
  }

  // Handle API enablement errors specially
  if (error instanceof APIError && isAPIEnablementError(error)) {
    throw createEnablementError(error);
  }
  throw error;
}

/**
 * Check whether a domain is verified in Google Workspace.
 */
export async function getDomainVerificationStatus(
  token: string,
  domainName: string,
): Promise<boolean> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
        domainName,
      )}`,
      token,
    );
    if (res.status === 404) return false;
    const data = await handleApiResponse<GoogleDomain>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return false;
    return Boolean(data.verified);
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return false;
    console.error(
      `Error fetching domain verification status for ${domainName}:`,
      error,
    );
    handleGoogleError(error);
  }
}

interface ListOrgUnitsResponse {
  organizationUnits?: GoogleOrgUnit[];
}
/** List all organizational units. */
export async function listOrgUnits(token: string): Promise<GoogleOrgUnit[]> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits?type=all`,
      token,
    );
    const data = await handleApiResponse<ListOrgUnitsResponse>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return [];
    return data.organizationUnits ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}

/**
 * Create an organizational unit under the given parent path.
 */
export async function createOrgUnit(
  token: string,
  name: string,
  parentOrgUnitPath = "/",
): Promise<GoogleOrgUnit | { alreadyExists: true }> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ name, parentOrgUnitPath }),
      },
    );
    console.log("Sending request to createOrgUnit:", {
      name,
      parentOrgUnitPath,
      url: `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits`,
    });

    return handleApiResponse<GoogleOrgUnit>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Get a single organizational unit by path. */
export async function getOrgUnit(
  token: string,
  ouPath: string,
): Promise<GoogleOrgUnit | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    console.log(
      `getOrgUnit: Fetching OU by path '${ouPath}' with token ${token}`,
    );
    const relativePath = ouPath.startsWith("/") ? ouPath.substring(1) : ouPath;
    if (!relativePath && ouPath === "/") {
      console.warn(
        "getOrgUnit: Attempting to fetch root OU ('/') by path. This specific function expects a non-root path.",
      );
      return null;
    }
    if (!relativePath) {
      return null;
    }
    const fetchUrl = `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits/${encodeURIComponent(
      relativePath,
    )}`;
    const res = await fetchWithAuth(fetchUrl, token);

    if (res.status === 404) {
      return null;
    }
    const data = await handleApiResponse<GoogleOrgUnit>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching OU '${ouPath}':`, error);
    handleGoogleError(error);
  }
}

/** Create a user in Google Workspace. */
export async function createUser(
  token: string,
  user: Partial<DirectoryUser>,
): Promise<DirectoryUser | { alreadyExists: true }> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(`${baseUrl}/users`, token, {
      method: "POST",
      body: JSON.stringify(user),
    });
    return handleApiResponse<DirectoryUser>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Fetch a user by user key (email or ID). */
export async function getUser(
  token: string,
  userKey: string,
): Promise<DirectoryUser | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/users/${encodeURIComponent(
        userKey,
      )}?fields=isAdmin,suspended,primaryEmail,name,id,orgUnitPath`,
      token,
    );
    if (res.status === 404) return null;
    const data = await handleApiResponse<DirectoryUser>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching user '${userKey}':`, error);
    handleGoogleError(error);
  }
}

export async function listUsers(
  token: string,
  params?: {
    domain?: string;
    query?: string;
    orderBy?: string;
    maxResults?: number;
  },
): Promise<DirectoryUser[]> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const queryParams = new URLSearchParams();
    if (params?.domain) queryParams.append("domain", params.domain);
    if (params?.query) queryParams.append("query", params.query);
    if (params?.orderBy) queryParams.append("orderBy", params.orderBy);
    if (params?.maxResults)
      queryParams.append("maxResults", params.maxResults.toString());
    const url = `${baseUrl}/users${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetchWithAuth(url, token);
    const data = await handleApiResponse<{ users?: DirectoryUser[] }>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data) {
      return [];
    }
    return data.users ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Add a secondary domain to the Google Workspace tenant. */
export async function addDomain(
  token: string,
  domainName: string,
): Promise<GoogleDomain | { alreadyExists: true }> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ domainName }),
      },
    );
    return handleApiResponse<GoogleDomain>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Retrieve domain details if present. */
export async function getDomain(
  token: string,
  domainName: string,
): Promise<GoogleDomain | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
        domainName,
      )}`,
      token,
    );
    if (res.status === 404) return null;
    const data = await handleApiResponse<GoogleDomain>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching domain '${domainName}':`, error);
    handleGoogleError(error);
  }
}

interface ListAdminRolesResponse {
  items?: GoogleRole[];
}
/** List available admin roles. */
export async function listAdminRoles(token: string): Promise<GoogleRole[]> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/roles`,
      token,
    );
    const data = await handleApiResponse<ListAdminRolesResponse>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return [];
    return data.items ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Assign an admin role to a user. */
export async function assignAdminRole(
  token: string,
  userEmail: string,
  roleId: string,
): Promise<GoogleRoleAssignment | { alreadyExists: true }> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/roleassignments`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          roleId,
          assignedTo: userEmail,
          scopeType: "CUSTOMER",
        }),
      },
    );
    return handleApiResponse<GoogleRoleAssignment>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/** List admin role assignments for a user. */
export async function listRoleAssignments(
  token: string,
  userKey: string,
): Promise<GoogleRoleAssignment[]> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/roleassignments?userKey=${encodeURIComponent(
        userKey,
      )}`,
      token,
    );
    const data = await handleApiResponse<{ items?: GoogleRoleAssignment[] }>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return [];
    return data.items ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Create a new inbound SAML SSO profile. */
export async function createSamlProfile(
  token: string,
  displayName: string,
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ displayName }),
      },
    );
    return handleApiResponse<InboundSamlSsoProfile>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Retrieve a specific SAML profile. */
export async function getSamlProfile(
  token: string,
  profileFullName: string,
): Promise<InboundSamlSsoProfile | null> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}`,
      token,
    );
    if (res.status === 404) return null;
    const data = await handleApiResponse<InboundSamlSsoProfile>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching SAML profile '${profileFullName}':`, error);
    handleGoogleError(error);
  }
}

/** List all SAML profiles for the customer. */
export async function listSamlProfiles(
  token: string,
): Promise<InboundSamlSsoProfile[]> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
      token,
    );
    const data = await handleApiResponse<{
      inboundSamlSsoProfiles?: InboundSamlSsoProfile[];
    }>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return [];
    return data.inboundSamlSsoProfiles ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Update settings for an existing SAML profile. */
export async function updateSamlProfile(
  token: string,
  profileFullName: string,
  config: Partial<Pick<InboundSamlSsoProfile, "idpConfig">>,
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const updateMaskPaths: string[] = [];
    if (config.idpConfig) updateMaskPaths.push("idpConfig");
    const updateMask = updateMaskPaths.join(",");

    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}${
        updateMask ? `?updateMask=${updateMask}` : ""
      }`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify(config),
      },
    );
    return handleApiResponse<InboundSamlSsoProfile>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

interface AssignSamlSsoPayload {
  assignments: SsoAssignment[];
}
/** Assign the SAML profile to one or more organizational units. */
export async function assignSamlToOrgUnits(
  token: string,
  profileFullName: string,
  assignments: AssignSamlSsoPayload["assignments"],
): Promise<object | { alreadyExists: true }> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}:assignToOrgUnits`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ assignments } as AssignSamlSsoPayload),
      },
    );
    return handleApiResponse<object>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/**
 * Enable provisioning on a SAML profile by adding IdP credentials.
 * Based on the Cloud Identity API endpoint:
 * https://cloud.google.com/identity/docs/reference/rest/v1/inboundSamlSsoProfiles.idpCredentials/add
 */
export async function addIdpCredentials(
  token: string,
  profileFullName: string,
  pemData?: string,
): Promise<{ success: boolean } | { alreadyExists: true }> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const body = pemData ? { pemData } : {};
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}/idpCredentials:add`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
    return handleApiResponse(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/**
 * List IdP credentials for a SAML profile
 * Based on the documented IdpCredential resource
 */
export async function listIdpCredentials(
  token: string,
  profileFullName: string,
): Promise<IdpCredential[]> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}/idpCredentials`,
      token,
    );
    const data = await handleApiResponse<{ idpCredentials?: IdpCredential[] }>(res);
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return [];
    return data.idpCredentials ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}
