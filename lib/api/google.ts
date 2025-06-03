import type { admin_directory_v1 } from "googleapis";

import { APIError, fetchWithAuth, handleApiResponse } from "./utils";

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
  displayName?: string;
  idpConfig?: {
    idpEntityId?: string;
    ssoUrl?: string;
    signRequest?: boolean;
    certificates?: { certificateData: string }[];
  };
  spConfig?: {
    spEntityId?: string;
    assertionConsumerServiceUrl?: string;
  };
  ssoMode?: "SSO_OFF" | "SAML_SSO_ENABLED";
  ssoAssignments?: {
    orgUnitId?: string;
    ssoMode?: "SSO_OFF" | "SAML_SSO_ENABLED" | "SSO_INHERITED";
  }[];
}

const GWS_CUSTOMER_ID = "my_customer";

function getDirectoryApiBaseUrl(): string {
  const envBase = process.env.GOOGLE_API_BASE;
  if (!envBase) {
    console.error("CRITICAL: GOOGLE_API_BASE environment variable is not set!");
    throw new Error("Google API base URL is not configured.");
  }
  return `${envBase}/admin/directory/v1`;
}

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

export async function getDomainVerificationStatus(
  token: string,
  domainName: string
): Promise<boolean> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      // Corrected to fetchWithAuth
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
        domainName
      )}`,
      token
    );
    if (res.status === 404) return false;
    const data = await handleApiResponse<GoogleDomain>(res); // Corrected to handleApiResponse
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return false;
    return Boolean(data.verified);
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return false;
    console.error(
      `Error fetching domain verification status for ${domainName}:`,
      error
    );
    throw error;
  }
}

interface ListOrgUnitsResponse {
  organizationUnits?: GoogleOrgUnit[];
}
export async function listOrgUnits(token: string): Promise<GoogleOrgUnit[]> {
  const baseUrl = getDirectoryApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${baseUrl}/customer/${GWS_CUSTOMER_ID}/orgunits?type=all`,
    token
  );
  const data = await handleApiResponse<ListOrgUnitsResponse>(res); // Corrected to handleApiResponse
  if (typeof data === "object" && data !== null && "alreadyExists" in data)
    return [];
  return data.organizationUnits ?? [];
}

export async function createOrgUnit(
  token: string,
  name: string,
  parentOrgUnitPath = "/"
): Promise<GoogleOrgUnit | { alreadyExists: true }> {
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

  return handleApiResponse<GoogleOrgUnit>(res); // Corrected to handleApiResponse
}

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
    const res = await fetchWithAuth(fetchUrl, token); // Corrected to fetchWithAuth

    if (res.status === 404) {
      return null;
    }
    const data = await handleApiResponse<GoogleOrgUnit>(res); // Corrected to handleApiResponse
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching OU '${ouPath}':`, error);
    throw error;
  }
}

export async function createUser(
  token: string,
  user: Partial<DirectoryUser>
): Promise<DirectoryUser | { alreadyExists: true }> {
  const baseUrl = getDirectoryApiBaseUrl();
  const res = await fetchWithAuth(`${baseUrl}/users`, token, {
    // Corrected to fetchWithAuth
    method: "POST",
    body: JSON.stringify(user),
  });
  return handleApiResponse<DirectoryUser>(res); // Corrected to handleApiResponse
}

export async function getUser(
  token: string,
  userKey: string
): Promise<DirectoryUser | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      // Corrected to fetchWithAuth
      `${baseUrl}/users/${encodeURIComponent(
        userKey
      )}?fields=isAdmin,suspended,primaryEmail,name,id,orgUnitPath`,
      token
    );
    if (res.status === 404) return null;
    const data = await handleApiResponse<DirectoryUser>(res); // Corrected to handleApiResponse
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching user '${userKey}':`, error);
    throw error;
  }
}

export async function addDomain(
  token: string,
  domainName: string
): Promise<GoogleDomain | { alreadyExists: true }> {
  const baseUrl = getDirectoryApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ domainName }),
    }
  );
  return handleApiResponse<GoogleDomain>(res); // Corrected to handleApiResponse
}

export async function getDomain(
  token: string,
  domainName: string
): Promise<GoogleDomain | null> {
  try {
    const baseUrl = getDirectoryApiBaseUrl();
    const res = await fetchWithAuth(
      // Corrected to fetchWithAuth
      `${baseUrl}/customer/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
        domainName
      )}`,
      token
    );
    if (res.status === 404) return null;
    const data = await handleApiResponse<GoogleDomain>(res); // Corrected to handleApiResponse
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching domain '${domainName}':`, error);
    throw error;
  }
}

interface ListAdminRolesResponse {
  items?: GoogleRole[];
}
export async function listAdminRoles(token: string): Promise<GoogleRole[]> {
  const baseUrl = getDirectoryApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${baseUrl}/customer/${GWS_CUSTOMER_ID}/roles`,
    token
  );
  const data = await handleApiResponse<ListAdminRolesResponse>(res); // Corrected to handleApiResponse
  if (typeof data === "object" && data !== null && "alreadyExists" in data)
    return [];
  return data.items ?? [];
}

export async function assignAdminRole(
  token: string,
  userEmail: string,
  roleId: string
): Promise<GoogleRoleAssignment | { alreadyExists: true }> {
  const baseUrl = getDirectoryApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
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
  return handleApiResponse<GoogleRoleAssignment>(res); // Corrected to handleApiResponse
}

export async function listRoleAssignments(
  token: string,
  userKey: string
): Promise<GoogleRoleAssignment[]> {
  const baseUrl = getDirectoryApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${baseUrl}/customer/${GWS_CUSTOMER_ID}/roleassignments?userKey=${encodeURIComponent(
      userKey
    )}`,
    token
  );
  const data = await handleApiResponse<{ items?: GoogleRoleAssignment[] }>(res); // Corrected to handleApiResponse
  if (typeof data === "object" && data !== null && "alreadyExists" in data)
    return [];
  return data.items ?? [];
}

export async function createSamlProfile(
  token: string,
  displayName: string
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${cloudIdentityBaseUrl}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ displayName }),
    }
  );
  return handleApiResponse<InboundSamlSsoProfile>(res); // Corrected to handleApiResponse
}

export async function getSamlProfile(
  token: string,
  profileFullName: string
): Promise<InboundSamlSsoProfile | null> {
  try {
    const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
    const res = await fetchWithAuth(
      `${cloudIdentityBaseUrl}/${profileFullName}`,
      token
    ); // Corrected to fetchWithAuth
    if (res.status === 404) return null;
    const data = await handleApiResponse<InboundSamlSsoProfile>(res); // Corrected to handleApiResponse
    if (typeof data === "object" && data !== null && "alreadyExists" in data)
      return null;
    return data;
  } catch (error) {
    if (error instanceof APIError && error.status === 404) return null;
    console.error(`Error fetching SAML profile '${profileFullName}':`, error);
    throw error;
  }
}

export async function listSamlProfiles(
  token: string
): Promise<InboundSamlSsoProfile[]> {
  const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${cloudIdentityBaseUrl}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
    token
  );
  const data = await handleApiResponse<{
    inboundSamlSsoProfiles?: InboundSamlSsoProfile[];
  }>(res); // Corrected to handleApiResponse
  if (typeof data === "object" && data !== null && "alreadyExists" in data)
    return [];
  return data.inboundSamlSsoProfiles ?? [];
}

export async function updateSamlProfile(
  token: string,
  profileFullName: string,
  config: Partial<Pick<InboundSamlSsoProfile, "idpConfig" | "ssoMode">>
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
  const updateMaskPaths: string[] = [];
  if (config.idpConfig) updateMaskPaths.push("idpConfig");
  if (config.ssoMode) updateMaskPaths.push("ssoMode");
  const updateMask = updateMaskPaths.join(",");

  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${cloudIdentityBaseUrl}/${profileFullName}${
      updateMask ? `?updateMask=${updateMask}` : ""
    }`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(config),
    }
  );
  return handleApiResponse<InboundSamlSsoProfile>(res); // Corrected to handleApiResponse
}

interface AssignSamlSsoPayload {
  assignments: {
    orgUnitId: string;
    ssoMode: "SSO_OFF" | "SAML_SSO_ENABLED" | "SSO_INHERITED";
  }[];
}
export async function assignSamlToOrgUnits(
  token: string,
  profileFullName: string,
  assignments: AssignSamlSsoPayload["assignments"]
): Promise<object | { alreadyExists: true }> {
  const cloudIdentityBaseUrl = getCloudIdentityApiBaseUrl();
  const res = await fetchWithAuth(
    // Corrected to fetchWithAuth
    `${cloudIdentityBaseUrl}/${profileFullName}:assignToOrgUnits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ assignments } as AssignSamlSsoPayload),
    }
  );
  return handleApiResponse<object>(res); // Corrected to handleApiResponse
}
