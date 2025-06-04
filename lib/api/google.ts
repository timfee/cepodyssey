import type { admin_directory_v1 } from "googleapis";

import {
  createEnablementError,
  isAPIEnablementError,
} from "./api-enablement-error";
import { wrapAuthError } from "./auth-interceptor";
import { APIError, fetchWithAuth, handleApiResponse } from "./utils";

export type DirectoryUser = admin_directory_v1.Schema$User;
export type GoogleOrgUnit = admin_directory_v1.Schema$OrgUnit;
export type GoogleRole = admin_directory_v1.Schema$Role;
export type GoogleRoleAssignment = admin_directory_v1.Schema$RoleAssignment;
export type GoogleDomain = admin_directory_v1.Schema$Domains & {
  verified?: boolean;
};
export type GoogleDomains = admin_directory_v1.Schema$Domains;

export interface GoogleLongRunningOperation {
  name?: string; // Name of the LRO itself, e.g., "operations/XYZ123"
  metadata?: {
    "@type"?: string;
    [key: string]: unknown;
  };
  done: boolean; // This is critical
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{ "@type"?: string; [key: string]: unknown }>;
  };
  response?: {
    "@type"?: string;
    name?: string; // Name of the created resource, e.g., "inboundSamlSsoProfiles/ABC789"
    customer?: string;
    displayName?: string;
    spConfig?: { entityId?: string; assertionConsumerServiceUri?: string };
    [key: string]: unknown; // Allow other fields of InboundSamlSsoProfile
  };
}

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
      "CRITICAL: GOOGLE_IDENTITY_BASE environment variable is not set!"
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
  domainName: string
): Promise<boolean> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
        domainName
      )}`,
      token
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
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits?type=all`,
      token
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
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ name, parentOrgUnitPath }),
      }
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
  ouPath: string
): Promise<GoogleOrgUnit | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
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
    const fetchUrl = `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits/${encodeURIComponent(
      relativePath
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
  user: Partial<DirectoryUser>
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
  userKey: string
): Promise<DirectoryUser | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/users/${encodeURIComponent(
        userKey
      )}?fields=isAdmin,suspended,primaryEmail,name,id,orgUnitPath`,
      token
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
  domainName: string
): Promise<GoogleDomain | { alreadyExists: true }> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ domainName }),
      }
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
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
        domainName
      )}`,
      token
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
      token
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
      }
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
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/roleassignments?userKey=${encodeURIComponent(
        userKey
      )}`,
      token
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
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    console.log(
      `Calling POST ${cloudIdentityBaseUrl}/inboundSamlSsoProfiles for displayName: ${displayName}`
    );
    const initialHttpResponse = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/inboundSamlSsoProfiles`, // Your specified URL
      token,
      {
        method: "POST",
        body: JSON.stringify({ displayName }),
      }
    );

    if (initialHttpResponse.status === 409) {
      console.log(
        `SAML Profile '${displayName}' creation returned 409 (already exists).`
      );
      // Consider parsing error body for more specific "already exists" if needed
      // const errorBody = await initialHttpResponse.json().catch(() => ({}));
      // if (errorBody?.error?.status === 'ALREADY_EXISTS' || errorBody?.error?.message?.toLowerCase().includes('already exists'))
      return { alreadyExists: true };
      // else throw new APIError...
    }

    // This will parse JSON and throw an APIError if initialHttpResponse.ok is false.
    // We expect the structure of a GoogleLongRunningOperation.
    const operation =
      await handleApiResponse<GoogleLongRunningOperation>(initialHttpResponse);
    console.log(
      "Direct response from POST /inboundSamlSsoProfiles:",
      JSON.stringify(operation, null, 2)
    );

    // Since you've confirmed the response has "done: true" immediately:
    if (operation.done) {
      if (operation.error) {
        console.error(
          "SAML profile creation operation reported 'done' but with an error:",
          operation.error
        );
        throw new APIError(
          `SAML profile creation failed: ${operation.error.message}`,
          operation.error.code || 500,
          operation.error.status || "OPERATION_ERROR"
        );
      }

      if (
        operation.response &&
        operation.response["@type"] ===
          "type.googleapis.com/google.identity.cloudidentity.v1.InboundSamlSsoProfile"
      ) {
        const finalProfile =
          operation.response as unknown as InboundSamlSsoProfile;
        console.log(
          "SAML Profile created successfully (operation was 'done: true' immediately):",
          finalProfile
        );

        // IMPORTANT: Validate crucial fields on the 'finalProfile' object
        if (
          !finalProfile.name ||
          !finalProfile.spConfig?.entityId ||
          !finalProfile.spConfig?.assertionConsumerServiceUri
        ) {
          const missingFields = [];
          if (!finalProfile.name)
            missingFields.push("profile.name (resource name)");
          if (!finalProfile.spConfig?.entityId)
            missingFields.push("profile.spConfig.entityId");
          if (!finalProfile.spConfig?.assertionConsumerServiceUri)
            missingFields.push("profile.spConfig.assertionConsumerServiceUri");
          console.error(
            `Immediately completed SAML profile response is missing crucial fields: ${missingFields.join(", ")}`,
            finalProfile
          );
          throw new APIError(
            `Completed SAML profile response is missing essential details: ${missingFields.join(", ")}.`,
            500,
            "INCOMPLETE_PROFILE_DATA"
          );
        }
        return finalProfile; // Successfully extracted and validated the profile
      } else {
        console.error(
          "Operation is 'done: true', but 'response' field is missing, not of expected type, or malformed:",
          operation.response
        );
        throw new APIError(
          "Operation completed but returned an unexpected or malformed response payload.",
          500,
          "MALFORMED_COMPLETED_OPERATION_PAYLOAD"
        );
      }
    } else {
      // This block means operation.done was false.
      // If the API *always* returns done:true as per your observation, this block indicates an unexpected API behavior.
      // For a truly pending LRO, operation.name (the LRO's own name) would be needed for polling.
      // If it's missing here, polling is impossible.
      if (!operation.name || operation.name.trim() === "") {
        console.error(
          "Operation is not 'done' and is missing a valid LRO 'name' for polling:",
          operation
        );
        throw new APIError(
          "Pending operation response is missing a valid 'name' for polling. Cannot proceed.",
          500,
          "PENDING_LRO_MISSING_POLL_NAME"
        );
      }
      // If you ever need to re-enable polling because the API *sometimes* returns a pending LRO:
      // 1. The polling loop would go here.
      // 2. It MUST use `operation.name` (the LRO's own name) for the polling URL,
      //    NOT `operation.response.name` (which is the profile's name and only available after completion).
      console.error(
        "Operation returned as not 'done'. This was unexpected. Full LRO polling logic would be required here using operation.name: ",
        operation.name
      );
      throw new APIError(
        "Operation returned as not 'done', and full polling logic for this case is not currently enabled in the simplified version.",
        500,
        "UNEXPECTED_PENDING_LRO"
      );
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "alreadyExists" in error
    ) {
      return { alreadyExists: true };
    }
    if (!(error instanceof APIError)) {
      console.error(
        "Unhandled generic exception/error in createSamlProfile:",
        error
      );
    }
    return handleGoogleError(error); // Ensure this re-throws
  }
}
/** Retrieve a specific SAML profile. */
export async function getSamlProfile(
  token: string,
  profileFullName: string
): Promise<InboundSamlSsoProfile | null> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}`,
      token
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
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
      token
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
      }
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
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}:assignToOrgUnits`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ assignments } as AssignSamlSsoPayload),
      }
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
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const body = pemData ? { pemData } : {};
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}/idpCredentials:add`,
      token,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
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
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}/idpCredentials`,
      token
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
