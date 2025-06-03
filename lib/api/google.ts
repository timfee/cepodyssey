import type { admin_directory_v1 } from "googleapis";
import { fetchWithAuth, handleApiResponse } from "./utils";

const GWS_BASE_URL = "https://admin.googleapis.com/admin/directory/v1";
const GCI_BASE_URL = "https://cloudidentity.googleapis.com/v1";
const GWS_CUSTOMER_ID = "my_customer";

export type OrgUnit = admin_directory_v1.Schema$OrgUnit;
export type DirectoryUser = admin_directory_v1.Schema$User;
export type Role = admin_directory_v1.Schema$Role;
export type RoleAssignment = admin_directory_v1.Schema$RoleAssignment;
export type Domain = admin_directory_v1.Schema$Domains;

export interface InboundSamlSsoProfile {
  name: string; // Full resource name, e.g., "inboundSamlSsoProfiles/xxxxxxxx"
  displayName: string;
  ssoMode?: "SSO_OFF" | "SAML_SSO_ENABLED";
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
}

export async function getOrgUnit(
  token: string,
  ouPath: string
): Promise<OrgUnit | null> {
  const path = ouPath.startsWith("/") ? ouPath.substring(1) : ouPath;
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/orgunits/${encodeURIComponent(
      path
    )}`,
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<OrgUnit>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function createOrgUnit(
  token: string,
  name: string,
  parentOrgUnitPath: string
): Promise<OrgUnit | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/orgunits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ name, parentOrgUnitPath }),
    }
  );
  return handleApiResponse(res);
}

export async function getUser(
  token: string,
  userKey: string
): Promise<DirectoryUser | null> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/users/${encodeURIComponent(userKey)}`,
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<DirectoryUser>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function createUser(
  token: string,
  userPayload: Partial<DirectoryUser>
): Promise<DirectoryUser | { alreadyExists: true }> {
  const res = await fetchWithAuth(`${GWS_BASE_URL}/users`, token, {
    method: "POST",
    body: JSON.stringify(userPayload),
  });
  return handleApiResponse(res);
}

export async function listAdminRoles(token: string): Promise<Role[]> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/roles`,
    token
  );
  const result = await handleApiResponse<{ items?: Role[] }>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? []
    : result.items ?? [];
}

export async function listRoleAssignments(
  token: string,
  userKey: string
): Promise<RoleAssignment[]> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/roleassignments?userKey=${encodeURIComponent(
      userKey
    )}`,
    token
  );
  const result = await handleApiResponse<{ items?: RoleAssignment[] }>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? []
    : result.items ?? [];
}

export async function assignAdminRole(
  token: string,
  userEmail: string,
  roleId: string
): Promise<RoleAssignment | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/roleassignments`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        assignedTo: userEmail,
        roleId: roleId,
        scopeType: "CUSTOMER", // Or other valid scopeType as needed
      }),
    }
  );
  return handleApiResponse(res);
}

export async function getDomain(
  token: string,
  domainName: string
): Promise<Domain | null> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/domains/${encodeURIComponent(
      domainName
    )}`,
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<Domain>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function addDomain(
  token: string,
  domainName: string
): Promise<Domain | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GWS_BASE_URL}/customers/${GWS_CUSTOMER_ID}/domains`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ domainName }),
    }
  );
  return handleApiResponse(res);
}

export async function listSamlProfiles(
  token: string
): Promise<InboundSamlSsoProfile[]> {
  const res = await fetchWithAuth(
    `${GCI_BASE_URL}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
    token
  );
  const result = await handleApiResponse<{
    inboundSamlSsoProfiles?: InboundSamlSsoProfile[];
  }>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? []
    : result.inboundSamlSsoProfiles ?? [];
}

export async function getSamlProfile(
  token: string,
  profileFullName: string
): Promise<InboundSamlSsoProfile | null> {
  const res = await fetchWithAuth(`${GCI_BASE_URL}/${profileFullName}`, token);
  if (res.status === 404) return null;
  const result = await handleApiResponse<InboundSamlSsoProfile>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function createSamlProfile(
  token: string,
  displayName: string
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GCI_BASE_URL}/inboundSamlSsoProfiles?parent=customers/${GWS_CUSTOMER_ID}`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ displayName }),
    }
  );
  return handleApiResponse(res);
}

export async function updateSamlProfile(
  token: string,
  profileFullName: string, // Full resource name e.g. inboundSamlSsoProfiles/PROFILE_ID
  updatePayload: Partial<InboundSamlSsoProfile>
): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
  // alreadyExists not typical for PATCH, but handleApiResponse structure
  const res = await fetchWithAuth(`${GCI_BASE_URL}/${profileFullName}`, token, {
    method: "PATCH",
    body: JSON.stringify(updatePayload),
  });
  return handleApiResponse(res);
}

export async function assignSamlToOrgUnits(
  token: string,
  profileFullName: string, // Full resource name
  assignments: {
    orgUnitId: string;
    ssoMode: "SAML_SSO_ENABLED" | "SSO_OFF";
  }[]
): Promise<object | { alreadyExists: true }> {
  // The response for this is usually empty on success
  const res = await fetchWithAuth(
    `${GCI_BASE_URL}/${profileFullName}:assignToOrgUnits`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ assignments }),
    }
  );
  return handleApiResponse(res);
}
