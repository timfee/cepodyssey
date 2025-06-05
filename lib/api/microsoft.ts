import type * as MicrosoftGraph from "microsoft-graph";
import { APIError, fetchWithAuth, handleApiResponse } from "./utils";
import { AlreadyExistsError } from "./errors";
import type { ApiLogger } from "./api-logger";
import { wrapAuthError } from "./auth-interceptor";
import { microsoftGraphUrls, microsoftAuthUrls } from "./url-builder";

/**
 * Azure Portal URL Reference:
 *
 * Gallery apps from Azure AD create both an App Registration and Enterprise Application.
 * ALL configuration for gallery apps happens in the Enterprise Application interface:
 *
 * - Overview: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/{spId}/appId/{appId}
 * - Provisioning: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/{appId}/objectId/{spId}
 * - Single Sign-On: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/{appId}/objectId/{spId}
 * - Users/Groups: /Microsoft_AAD_IAM/ManagedAppMenuBlade/~/UsersAndGroups/servicePrincipalId/{spId}/appId/{appId}
 *
 * Note: Microsoft uses inconsistent parameter names (servicePrincipalId vs objectId) across blades.
 */

function handleMicrosoftError(error: unknown): never {
  if (error instanceof APIError && error.status === 401) {
    throw wrapAuthError(error, "microsoft");
  }
  throw error;
}

export type ServicePrincipal = MicrosoftGraph.ServicePrincipal;
export type Application = MicrosoftGraph.Application;
export type SynchronizationJob = MicrosoftGraph.SynchronizationJob;
export type AppRoleAssignment = MicrosoftGraph.AppRoleAssignment;
export type SynchronizationSchema = MicrosoftGraph.SynchronizationSchema;
export type SynchronizationRule = MicrosoftGraph.SynchronizationRule;

/**
 * List Azure AD applications.
 * Optional OData filter narrows results, returning an empty array
 * if no applications match.
 */
export async function listApplications(
  token: string,
  filter?: string,
  logger?: ApiLogger,
): Promise<Application[]> {
  try {
    const url = microsoftGraphUrls.applications.list(filter);
    const res = await fetchWithAuth(url, token, undefined, logger);
    const result = await handleApiResponse<{ value: Application[] }>(res);
    if (
      typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
    ) {
      return [];
    }
    return result.value ?? [];
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Retrieve a service principal using its application client ID.
 * Returns null if no matching service principal exists.
 */
export async function getServicePrincipalByAppId(
  token: string,
  appId: string,
  logger?: ApiLogger,
): Promise<ServicePrincipal | null> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.list(`appId eq '${appId}'`),
      token,
      undefined,
      logger,
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
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Fetch detailed information for a service principal by object ID.
 * Returns null when the principal cannot be found.
 */
export async function getServicePrincipalDetails(
  token: string,
  spObjectId: string,
  logger?: ApiLogger,
): Promise<ServicePrincipal | null> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.get(spObjectId),
      token,
      undefined,
      logger,
    );
    if (res.status === 404) return null;
    const result = await handleApiResponse<ServicePrincipal>(res);
    return typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
      ? null
      : result;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Retrieve application details using the object ID.
 * Returns null when the application cannot be found.
 */
export async function getApplicationDetails(
  token: string,
  applicationObjectId: string,
  logger?: ApiLogger,
): Promise<Application | null> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.applications.get(applicationObjectId),
      token,
      undefined,
      logger,
    );
    if (res.status === 404) return null;
    const result = await handleApiResponse<Application>(res);
    return typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
      ? null
      : result;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Instantiate an enterprise application from a gallery template.
 * Returns `{ alreadyExists: true }` if the app has been created previously.
 */
export async function createEnterpriseApp(
  token: string,
  templateId: string,
  displayName: string,
  logger?: ApiLogger,
): Promise<{ application: Application; servicePrincipal: ServicePrincipal }> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.applicationTemplates.instantiate(templateId),
      token,
      {
        method: "POST",
        body: JSON.stringify({ displayName }),
      },
      logger,
    );
    const data = await handleApiResponse<{
      application: Application;
      servicePrincipal: ServicePrincipal;
    }>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError(
        `Enterprise app '${displayName}' already exists`,
      );
    }
    return data as {
      application: Application;
      servicePrincipal: ServicePrincipal;
    };
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Update an existing service principal with partial data.
 * Returns `{ alreadyExists: true }` when the patch conflicts with
 * a duplicate property.
 */
export async function patchServicePrincipal(
  token: string,
  servicePrincipalId: string,
  body: Partial<ServicePrincipal>,
  logger?: ApiLogger,
): Promise<void | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.update(servicePrincipalId),
      token,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      logger,
    );
    return handleApiResponse<void>(res);
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Patch an existing Azure AD application.
 * Returns `{ alreadyExists: true }` on conflicting updates.
 */
export async function updateApplication(
  token: string,
  applicationObjectId: string,
  body: Partial<Application>,
  logger?: ApiLogger,
): Promise<void | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.applications.update(applicationObjectId),
      token,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      logger,
    );
    return handleApiResponse<void>(res);
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Create a new synchronization job for a service principal using the
 * GoogleApps template. Returns `{ alreadyExists: true }` when a job
 * already exists.
 */
export async function createProvisioningJob(
  token: string,
  servicePrincipalId: string,
  logger?: ApiLogger,
): Promise<SynchronizationJob> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.create(
        servicePrincipalId,
      ),
      token,
      {
        method: "POST",
        body: JSON.stringify({ templateId: "GoogleApps" }),
      },
      logger,
    );
    const data = await handleApiResponse<SynchronizationJob>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError("Provisioning job already exists");
    }
    return data as SynchronizationJob;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * List provisioning jobs for a service principal.
 * Returns an empty array when no jobs exist.
 */
export async function listSynchronizationJobs(
  token: string,
  servicePrincipalId: string,
  logger?: ApiLogger,
): Promise<SynchronizationJob[]> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.list(
        servicePrincipalId,
      ),
      token,
      undefined,
      logger,
    );
    const result = await handleApiResponse<{ value: SynchronizationJob[] }>(
      res,
    );
    if (
      typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
    ) {
      return [];
    }
    return result.value ?? [];
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Retrieve details for a specific provisioning job.
 * Returns null if the job no longer exists.
 */
export async function getProvisioningJob(
  token: string,
  servicePrincipalId: string,
  jobId: string,
  logger?: ApiLogger,
): Promise<SynchronizationJob | null> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.get(
        servicePrincipalId,
        jobId,
      ),
      token,
      undefined,
      logger,
    );
    if (res.status === 404) return null;
    const result = await handleApiResponse<SynchronizationJob>(res);
    return typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
      ? null
      : result;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Fetch the synchronization schema for a provisioning job.
 * Returns null if the schema has not been created.
 */
export async function getSynchronizationSchema(
  token: string,
  servicePrincipalId: string,
  jobId: string,
  logger?: ApiLogger,
): Promise<SynchronizationSchema | null> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.schema(
        servicePrincipalId,
        jobId,
      ),
      token,
      undefined,
      logger,
    );
    if (res.status === 404) return null;
    const result = await handleApiResponse<SynchronizationSchema>(res);
    return typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
      ? null
      : result;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Replace credentials used for the provisioning job.
 * Returns `{ alreadyExists: true }` when conflicts occur.
 */
export async function updateProvisioningCredentials(
  token: string,
  servicePrincipalId: string,
  credentials: { key: string; value: string }[],
  logger?: ApiLogger,
): Promise<void | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.secrets(
        servicePrincipalId,
      ),
      token,
      {
        method: "PUT",
        body: JSON.stringify({ value: credentials }),
      },
      logger,
    );
    return handleApiResponse<void>(res);
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Start an existing provisioning job.
 * Returns `{ alreadyExists: true }` for race conditions when the job is
 * already running.
 */
export async function startProvisioningJob(
  token: string,
  servicePrincipalId: string,
  jobId: string,
  logger?: ApiLogger,
): Promise<void | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.start(
        servicePrincipalId,
        jobId,
      ),
      token,
      { method: "POST" },
      logger,
    );
    return handleApiResponse<void>(res);
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Configure attribute mappings for a provisioning job. Accepts either
 * full synchronization rules or partial schema patches.
 */
export async function configureAttributeMappings(
  token: string,
  servicePrincipalId: string,
  jobId: string,
  schemaPayload:
    | { synchronizationRules: MicrosoftGraph.SynchronizationRule[] }
    | Partial<SynchronizationSchema>,
  logger?: ApiLogger,
): Promise<SynchronizationSchema | { alreadyExists: true }> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.schema(
        servicePrincipalId,
        jobId,
      ),
      token,
      {
        method: "PUT",
        body: JSON.stringify(schemaPayload),
      },
      logger,
    );
    const data = await handleApiResponse<
      SynchronizationSchema | { alreadyExists: true }
    >(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError("Attribute mappings already configured");
    }
    return data as SynchronizationSchema;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * Assign a user or group to an enterprise application.
 * Returns `{ alreadyExists: true }` when the assignment is duplicated.
 */
export async function assignUsersToApp(
  token: string,
  servicePrincipalId: string,
  principalId: string,
  appRoleId: string,
  logger?: ApiLogger,
): Promise<AppRoleAssignment> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.appRoleAssignments.create(
        servicePrincipalId,
      ),
      token,
      {
        method: "POST",
        body: JSON.stringify({
          principalId,
          resourceId: servicePrincipalId,
          appRoleId,
        }),
      },
      logger,
    );
    const data = await handleApiResponse<AppRoleAssignment>(res);
    if (typeof data === "object" && "alreadyExists" in data) {
      throw new AlreadyExistsError("Principal already assigned to app");
    }
    return data as AppRoleAssignment;
  } catch (error) {
    handleMicrosoftError(error);
  }
}

/**
 * List role assignments for an application's service principal.
 */
export async function listAppRoleAssignments(
  token: string,
  servicePrincipalObjectId: string,
  logger?: ApiLogger,
): Promise<AppRoleAssignment[]> {
  try {
    const res = await fetchWithAuth(
      microsoftGraphUrls.servicePrincipals.appRoleAssignments.list(
        servicePrincipalObjectId,
      ),
      token,
      undefined,
      logger,
    );
    const result = await handleApiResponse<{ value: AppRoleAssignment[] }>(res);
    return typeof result === "object" &&
      result !== null &&
      "alreadyExists" in result
      ? []
      : (result.value ?? []);
  } catch (error) {
    handleMicrosoftError(error);
  }
}

export interface SamlMetadata {
  entityId: string;
  ssoUrl: string;
  certificate: string;
}

/** Fetch SAML metadata XML and parse key fields. */
export async function getSamlMetadata(
  tenantId: string,
  appId: string,
  logger?: ApiLogger,
): Promise<SamlMetadata> {
  try {
    const url = microsoftAuthUrls.samlMetadata(tenantId, appId);
    const res = await fetchWithAuth(url, "", undefined, logger);
    if (!res.ok) {
      throw new APIError(
        `Failed to fetch SAML metadata: ${res.statusText}`,
        res.status,
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
  } catch (error) {
    handleMicrosoftError(error);
  }
}
export { microsoftApi } from "./microsoft/index";
