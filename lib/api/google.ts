import type { admin_directory_v1 } from "googleapis";

import {
  createEnablementError,
  isAPIEnablementError,
} from "./api-enablement-error";
import type { ApiLogger } from "./api-logger";
import { wrapAuthError } from "./auth-interceptor";
import {
  API_BASES,
  googleDirectoryUrls,
  googleIdentityUrls,
} from "./url-builder";
import { APIError, fetchWithAuth, handleApiResponse } from "./utils";
import { AlreadyExistsError } from "./errors";

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

export async function getLoggedInUser(
  token: string,
  logger?: ApiLogger
): Promise<DirectoryUser> {
  try {
    const profileRes = await fetchWithAuth(
      `${API_BASES.googleOAuth}/userinfo`,
      token,
      undefined,
      logger
    );
    const profile = await profileRes.json();
    const email = profile.email;
    const userRes = await fetchWithAuth(
      googleDirectoryUrls.users.get(email),
      token,
      undefined,
      logger
    );
    const data = await handleApiResponse<DirectoryUser>(userRes);
    if (data && typeof data === "object" && "alreadyExists" in data) {
      throw new APIError("User lookup failed", 404);
    }
    return data;
  } catch (error) {
    handleGoogleError(error);
  }
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
  logger?: ApiLogger
): Promise<boolean> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.domains.get(GWS_CUSTOMER_ID, domainName),
      token,
      undefined,
      logger
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
export async function listOrgUnits(
  token: string,
  logger?: ApiLogger
): Promise<GoogleOrgUnit[]> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.orgUnits.list(GWS_CUSTOMER_ID),
      token,
      undefined,
      logger
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
  customerId = GWS_CUSTOMER_ID,
  logger?: ApiLogger
): Promise<GoogleOrgUnit> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.orgUnits.create(customerId),
      token,
      {
        method: "POST",
        body: JSON.stringify({ name, parentOrgUnitPath }),
      },
      logger
    );
    console.log("Sending request to createOrgUnit:", {
      name,
      parentOrgUnitPath,
      url: googleDirectoryUrls.orgUnits.create(customerId),
    });

    const data = await handleApiResponse<GoogleOrgUnit>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError(`Org unit '${name}' already exists`);
    }
    return data;
  } catch (error) {
    if (
      error instanceof APIError &&
      error.status === 400 &&
      error.message.includes("Invalid Ou Id")
    ) {
      // Fallback to using parentOrgUnitId by fetching the root OU ID
      const orgUnits = await listOrgUnits(token, logger);
      const rootOu = orgUnits.find((ou) => ou.orgUnitPath === "/");
      if (rootOu?.orgUnitId) {
        const retryRes = await fetchWithAuth(
          googleDirectoryUrls.orgUnits.create(customerId),
          token,
          {
            method: "POST",
            body: JSON.stringify({ name, parentOrgUnitId: rootOu.orgUnitId }),
          },
          logger
        );
        const retryData = await handleApiResponse<GoogleOrgUnit>(retryRes);
        if (typeof retryData === "object" && "alreadyExists" in retryData) {
          throw new AlreadyExistsError(`Org unit '${name}' already exists`);
        }
        return retryData;
      }
    }

    handleGoogleError(error);
  }
}

/** Get a single organizational unit by path. */
export async function getOrgUnit(
  token: string,
  ouPath: string,
  logger?: ApiLogger
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
      relativePath
    );
    const res = await fetchWithAuth(fetchUrl, token, undefined, logger);

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
  logger?: ApiLogger
): Promise<DirectoryUser> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.users.create(),
      token,
      {
        method: "POST",
        body: JSON.stringify(user),
      },
      logger
    );
    const data = await handleApiResponse<DirectoryUser>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError(`User '${user.primaryEmail}' already exists`);
    }
    return data;
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Fetch a user by user key (email or ID). */
export async function getUser(
  token: string,
  userKey: string,
  logger?: ApiLogger
): Promise<DirectoryUser | null> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.users.get(userKey),
      token,
      undefined,
      logger
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
  logger?: ApiLogger
): Promise<DirectoryUser[]> {
  try {
    const url = googleDirectoryUrls.users.list(params);
    const res = await fetchWithAuth(url, token, undefined, logger);
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
  logger?: ApiLogger
): Promise<GoogleDomain> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.domains.create(GWS_CUSTOMER_ID),
      token,
      {
        method: "POST",
        body: JSON.stringify({ domainName }),
      },
      logger
    );
    const data = await handleApiResponse<GoogleDomain>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError(`Domain '${domainName}' already exists`);
    }
    return data;
  } catch (error) {
    handleGoogleError(error);
  }
}

/** Retrieve domain details if present. */
export async function getDomain(
  token: string,
  domainName: string,
  logger?: ApiLogger
): Promise<GoogleDomain | null> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.domains.get(GWS_CUSTOMER_ID, domainName),
      token,
      undefined,
      logger
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
export async function listAdminRoles(
  token: string,
  logger?: ApiLogger
): Promise<GoogleRole[]> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.roles.list(GWS_CUSTOMER_ID),
      token,
      undefined,
      logger
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
  customerId = GWS_CUSTOMER_ID,
  logger?: ApiLogger
): Promise<GoogleRoleAssignment> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.roles.assignments.create(customerId),
      token,
      {
        method: "POST",
        body: JSON.stringify({
          roleId,
          assignedTo: userEmail,
          scopeType: "CUSTOMER",
        }),
      },
      logger
    );
    const data = await handleApiResponse<GoogleRoleAssignment>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError(
        `Admin role '${roleId}' already assigned to ${userEmail}`,
      );
    }
    return data;
  } catch (error) {
    handleGoogleError(error);
  }
}

/** List admin role assignments for a user. */
export async function listRoleAssignments(
  token: string,
  userKey: string,
  logger?: ApiLogger
): Promise<GoogleRoleAssignment[]> {
  try {
    const res = await fetchWithAuth(
      googleDirectoryUrls.roles.assignments.list(GWS_CUSTOMER_ID, userKey),
      token,
      undefined,
      logger
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
  displayName: string,
  logger?: ApiLogger
): Promise<InboundSamlSsoProfile> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.create(),
      token,
      {
        method: "POST",
        body: JSON.stringify({ displayName }),
      },
      logger
    );

    const data = await handleApiResponse<{
      done: boolean;
      response: InboundSamlSsoProfile;
    }>(res);

    if ("alreadyExists" in data) {
      throw new AlreadyExistsError(`SAML profile '${displayName}' already exists`);
    }

    if (!data.done || !data.response) {
      throw new APIError("Invalid response from createSamlProfile", 500);
    }

    return data.response;
  } catch (error) {
    if (error instanceof AlreadyExistsError) throw error;
    handleGoogleError(error);
  }
}
/** Retrieve a specific SAML profile. */
export async function getSamlProfile(
  token: string,
  profileFullName: string,
  logger?: ApiLogger
): Promise<InboundSamlSsoProfile | null> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.get(profileFullName),
      token,
      undefined,
      logger
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
  logger?: ApiLogger
): Promise<InboundSamlSsoProfile[]> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.list(),
      token,
      undefined,
      logger
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
  logger?: ApiLogger
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
      logger
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
  logger?: ApiLogger
): Promise<object> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.assignToOrgUnits(profileFullName),
      token,
      {
        method: "POST",
        body: JSON.stringify({ assignments } as AssignSamlSsoPayload),
      },
      logger
    );
    const data = await handleApiResponse<object>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError("SAML profile already assigned to OU");
    }
    return data;
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
  logger?: ApiLogger
): Promise<{ success: boolean }> {
  try {
    const body = pemData ? { pemData } : {};
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.idpCredentials.add(profileFullName),
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      logger
    );
    const data = await handleApiResponse<{ success: boolean }>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError("IdP credentials already exist");
    }
    return data as { success: boolean };
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
  logger?: ApiLogger
): Promise<IdpCredential[]> {
  try {
    const res = await fetchWithAuth(
      googleIdentityUrls.samlProfiles.idpCredentials.list(profileFullName),
      token,
      undefined,
      logger
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
