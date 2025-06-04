import type { admin_directory_v1 } from "googleapis";

import {
  createEnablementError,
  isAPIEnablementError,
} from "./api-enablement-error";
import { wrapAuthError } from "./auth-interceptor";
import { APIError, fetchWithAuth, handleApiResponse } from "./utils";
import { googleDirectoryUrls, googleIdentityUrls } from "./url-builder";

export type DirectoryUser = admin_directory_v1.Schema$User;
export type GoogleOrgUnit = admin_directory_v1.Schema$OrgUnit;
export type GoogleRole = admin_directory_v1.Schema$Role;
export type GoogleRoleAssignment = admin_directory_v1.Schema$RoleAssignment;
export type GoogleDomain = admin_directory_v1.Schema$Domains & {
  verified?: boolean;
};
export type GoogleDomains = admin_directory_v1.Schema$Domains;

export interface InboundSamlSsoProfile {
  /** Output only. Resource name, e.g. inboundSamlSsoProfiles/{profileId} */
  name?: string;
  /** Output only. Customer resource */
  customer?: string;
  /** Display name when creating the profile */
  displayName?: string;
  idpConfig?: {
    entityId?: string;
    singleSignOnServiceUri?: string;
    logoutRedirectUri?: string;
    changePasswordUri?: string;
  };
  /** Output only. SP configuration returned after creation */
  spConfig?: {
    entityId?: string;
    assertionConsumerServiceUri?: string;
  };
  ssoMode?: "SSO_OFF" | "SAML_SSO_ENABLED" | "SSO_INHERITED";
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
  domainName: string
): Promise<boolean> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.domains.get(GWS_CUSTOMER_ID, domainName),
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
      error
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
    const res = await fetchWithAuth(
      googleDirectoryUrls.orgUnits.list(GWS_CUSTOMER_ID),
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
  parentOrgUnitPath = "/"
): Promise<GoogleOrgUnit | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.orgUnits.create(GWS_CUSTOMER_ID),
      token,
      {
        method: "POST",
        body: JSON.stringify({ name, parentOrgUnitPath }),
      },
    );
    console.log("Sending request to createOrgUnit:", {
      name,
      parentOrgUnitPath,
      url: googleDirectoryUrls.orgUnits.create(GWS_CUSTOMER_ID),
    });

    return handleApiResponse<GoogleOrgUnit>(res);
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Get a single organizational unit by path. */
export async function getOrgUnit(
  token: string,
  ouPath: string
): Promise<GoogleOrgUnit | null> {
  try {
    console.log(
      `getOrgUnit: Fetching OU by path '${ouPath}' with token ${token}`
    );
    const relativePath = ouPath.startsWith("/") ? ouPath.substring(1) : ouPath;
    if (!relativePath && ouPath === "/") {
      console.warn(
        "getOrgUnit: Attempting to fetch root OU ('/') by path. This specific function expects a non-root path."
      );
      return null;
    }
    if (!relativePath) {
      return null;
    }
    const fetchUrl = googleDirectoryUrls.orgUnits.get(
      GWS_CUSTOMER_ID,
      relativePath,
    );
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
  user: Partial<DirectoryUser>
): Promise<DirectoryUser | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(googleDirectoryUrls.users.create(), token, {
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
  userKey: string
): Promise<DirectoryUser | null> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.users.get(userKey),
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
  }
): Promise<DirectoryUser[]> {
  try {
    const url = googleDirectoryUrls.users.list(params);
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
  domainName: string
): Promise<GoogleDomain | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.domains.create(GWS_CUSTOMER_ID),
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
  domainName: string
): Promise<GoogleDomain | null> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.domains.get(GWS_CUSTOMER_ID, domainName),
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
    const res = await fetchWithAuth(
      googleDirectoryUrls.roles.list(GWS_CUSTOMER_ID),
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
  roleId: string
): Promise<GoogleRoleAssignment | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.roles.assignments.create(GWS_CUSTOMER_ID),
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
  userKey: string
): Promise<GoogleRoleAssignment[]> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.roles.assignments.list(GWS_CUSTOMER_ID, userKey),
      token,
    );
    const data = await handleApiResponse<{ items?: GoogleRoleAssignment[] }>(
      res
    );
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
  displayName: string
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.create(),
      token,
      {
        method: "POST",
        body: JSON.stringify({ displayName }),
      },
    );

    const data = await handleApiResponse<{
      done: boolean;
      response: InboundSamlSsoProfile;
    }>(res);

    if ("alreadyExists" in data) {
      return { alreadyExists: true };
    }

    if (!data.done || !data.response) {
      throw new APIError("Invalid response from createSamlProfile", 500);
    }

    return data.response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "alreadyExists" in error
    ) {
      return { alreadyExists: true };
    }
    handleGoogleError(error);
  }
}
/** Retrieve a specific SAML profile. */
export async function getSamlProfile(
  token: string,
  profileFullName: string
): Promise<InboundSamlSsoProfile | null> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.get(profileFullName),
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
  token: string
): Promise<InboundSamlSsoProfile[]> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.list(),
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
  config: Partial<Pick<InboundSamlSsoProfile, "idpConfig">>
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  try {
    const updateMaskPaths: string[] = [];
    if (config.idpConfig) updateMaskPaths.push("idpConfig");
    const updateMask = updateMaskPaths.join(",");

    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.update(profileFullName, updateMask),
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
  assignments: AssignSamlSsoPayload["assignments"]
): Promise<object | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.assignToOrgUnits(profileFullName),
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
  pemData?: string
): Promise<{ success: boolean } | { alreadyExists: true }> {
  try {
    const body = pemData ? { pemData } : {};
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.idpCredentials.add(profileFullName),
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
  profileFullName: string
): Promise<IdpCredential[]> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.idpCredentials.list(profileFullName),
      token,
    );
    const data = await handleApiResponse<{ idpCredentials?: IdpCredential[] }>(
      res
    );
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return [];
    return data.idpCredentials ?? [];
  } catch (error) {
    handleGoogleError(error);
  }
}
