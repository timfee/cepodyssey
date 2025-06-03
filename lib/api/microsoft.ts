import type * as MicrosoftGraph from "microsoft-graph";
import { APIError, fetchWithAuth, handleApiResponse } from "./utils";

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

export type ServicePrincipal = MicrosoftGraph.ServicePrincipal;
export type Application = MicrosoftGraph.Application;
export type SynchronizationJob = MicrosoftGraph.SynchronizationJob;
export type AppRoleAssignment = MicrosoftGraph.AppRoleAssignment;
export type SynchronizationSchema = MicrosoftGraph.SynchronizationSchema;
export type SynchronizationRule = MicrosoftGraph.SynchronizationRule; // Added for typing

export async function listApplications(
  token: string,
  filter?: string
): Promise<Application[]> {
  let url = `${GRAPH_BASE_URL}/applications`;
  if (filter) {
    url += `?$filter=${encodeURIComponent(filter)}`;
  }
  const res = await fetchWithAuth(url, token);
  const result = await handleApiResponse<{ value: Application[] }>(res);
  if (
    typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
  ) {
    return []; // Should not happen for a list GET
  }
  return result.value ?? [];
}

export async function getServicePrincipalByAppId(
  token: string,
  appId: string
): Promise<ServicePrincipal | null> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals?$filter=appId eq '${appId}'&$select=id,appId,displayName,accountEnabled,appOwnerOrganizationId`, // Added accountEnabled
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<{ value: ServicePrincipal[] }>(res);
  if (
    typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
  )
    return null;
  return result.value[0] ?? null;
}

export async function getServicePrincipalDetails(
  token: string,
  spObjectId: string
): Promise<ServicePrincipal | null> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${spObjectId}?$select=id,appId,displayName,accountEnabled`,
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<ServicePrincipal>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function getApplicationDetails(
  token: string,
  applicationObjectId: string
): Promise<Application | null> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/applications/${applicationObjectId}?$select=id,appId,displayName,identifierUris,web`,
    token
  ); // Select specific fields
  if (res.status === 404) return null;
  const result = await handleApiResponse<Application>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function createEnterpriseApp(
  token: string,
  templateId: string,
  displayName: string
): Promise<
  | { application: Application; servicePrincipal: ServicePrincipal }
  | { alreadyExists: true }
> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/applicationTemplates/${templateId}/instantiate`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ displayName }),
    }
  );
  return handleApiResponse(res);
}

export async function patchServicePrincipal(
  token: string,
  servicePrincipalId: string,
  body: Partial<ServicePrincipal>
): Promise<void | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
  return handleApiResponse(res);
}

export async function updateApplication(
  token: string,
  applicationObjectId: string,
  body: Partial<Application>
): Promise<void | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/applications/${applicationObjectId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
  return handleApiResponse(res);
}

export async function createProvisioningJob(
  token: string,
  servicePrincipalId: string
): Promise<SynchronizationJob | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/jobs`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ templateId: "GoogleApps" }),
    }
  );
  return handleApiResponse(res);
}

export async function listSynchronizationJobs(
  token: string,
  servicePrincipalId: string
): Promise<SynchronizationJob[]> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/jobs`,
    token
  );
  const result = await handleApiResponse<{ value: SynchronizationJob[] }>(res);
  if (
    typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
  ) {
    return [];
  }
  return result.value ?? [];
}

export async function getProvisioningJob(
  token: string,
  servicePrincipalId: string,
  jobId: string
): Promise<SynchronizationJob | null> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/jobs/${jobId}`,
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<SynchronizationJob>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function getSynchronizationSchema(
  token: string,
  servicePrincipalId: string,
  jobId: string
): Promise<SynchronizationSchema | null> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/jobs/${jobId}/schema`,
    token
  );
  if (res.status === 404) return null;
  const result = await handleApiResponse<SynchronizationSchema>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? null
    : result;
}

export async function updateProvisioningCredentials(
  token: string,
  servicePrincipalId: string,
  credentials: { key: string; value: string }[]
): Promise<void | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/secrets`,
    token,
    {
      method: "PUT",
      body: JSON.stringify({ value: credentials }),
    }
  );
  return handleApiResponse(res);
}

export async function startProvisioningJob(
  token: string,
  servicePrincipalId: string,
  jobId: string
): Promise<void | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/jobs/${jobId}/start`,
    token,
    { method: "POST" }
  );
  return handleApiResponse(res);
}

export async function configureAttributeMappings(
  token: string,
  servicePrincipalId: string,
  jobId: string,
  // Use a more specific type if the payload structure is fixed, or keep as object for flexibility
  schemaPayload:
    | { synchronizationRules: MicrosoftGraph.SynchronizationRule[] }
    | Partial<SynchronizationSchema>
): Promise<SynchronizationSchema | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/synchronization/jobs/${jobId}/schema`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(schemaPayload),
    }
  );
  return handleApiResponse(res);
}

export async function assignUsersToApp(
  token: string,
  servicePrincipalId: string,
  principalId: string,
  appRoleId: string
): Promise<AppRoleAssignment | { alreadyExists: true }> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalId}/appRoleAssignedTo`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        principalId,
        resourceId: servicePrincipalId,
        appRoleId,
      }),
    }
  );
  return handleApiResponse(res);
}

export async function listAppRoleAssignments(
  token: string,
  servicePrincipalObjectId: string
): Promise<AppRoleAssignment[]> {
  const res = await fetchWithAuth(
    `${GRAPH_BASE_URL}/servicePrincipals/${servicePrincipalObjectId}/appRoleAssignedTo`,
    token
  );
  const result = await handleApiResponse<{ value: AppRoleAssignment[] }>(res);
  return typeof result === "object" &&
    result !== null &&
    "alreadyExists" in result
    ? []
    : result.value ?? [];
}

export interface SamlMetadata {
  entityId: string;
  ssoUrl: string;
  certificate: string;
}

export async function getSamlMetadata(
  tenantId: string,
  appId: string
): Promise<SamlMetadata> {
  const url = `https://login.microsoftonline.com/${tenantId}/federationmetadata/2007-06/federationmetadata.xml?appid=${appId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new APIError(
      `Failed to fetch SAML metadata: ${res.statusText}`,
      res.status
    );
  }
  const xml = await res.text();
  const entityIdMatch = /entityID="([^"]+)"/.exec(xml);
  const ssoUrlMatch = /SingleSignOnService[^>]*Location="([^"]+)"/.exec(xml);
  const certMatch = /<X509Certificate>([^<]+)<\/X509Certificate>/.exec(xml);
  if (!entityIdMatch?.[1] || !ssoUrlMatch?.[1] || !certMatch?.[1]) {
    throw new APIError("Could not parse SAML metadata XML.", 500);
  }
  return {
    entityId: entityIdMatch[1],
    ssoUrl: ssoUrlMatch[1],
    certificate: certMatch[1],
  };
}
