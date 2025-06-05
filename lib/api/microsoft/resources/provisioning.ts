import { microsoftApiClient } from "../client";
import { microsoftGraphUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { SynchronizationJob, SynchronizationSchema } from "../types";
import type { ApiLogger } from "../../api-logger";

export const provisioning = {
  async createJob(
    servicePrincipalId: string,
    logger?: ApiLogger,
  ): Promise<SynchronizationJob> {
    try {
      return await microsoftApiClient.post<SynchronizationJob>(
        microsoftGraphUrls.servicePrincipals.synchronization.jobs.create(
          servicePrincipalId,
        ),
        { templateId: "GoogleApps" },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError("Provisioning job already exists");
      }
      throw error;
    }
  },

  async listJobs(
    servicePrincipalId: string,
    logger?: ApiLogger,
  ): Promise<SynchronizationJob[]> {
    const res = await microsoftApiClient.get<{ value: SynchronizationJob[] }>(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.list(
        servicePrincipalId,
      ),
      logger,
    );
    return res.value ?? [];
  },

  async getJob(
    servicePrincipalId: string,
    jobId: string,
    logger?: ApiLogger,
  ): Promise<SynchronizationJob | null> {
    try {
      return await microsoftApiClient.get<SynchronizationJob>(
        microsoftGraphUrls.servicePrincipals.synchronization.jobs.get(
          servicePrincipalId,
          jobId,
        ),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async getSchema(
    servicePrincipalId: string,
    jobId: string,
    logger?: ApiLogger,
  ): Promise<SynchronizationSchema | null> {
    try {
      return await microsoftApiClient.get<SynchronizationSchema>(
        microsoftGraphUrls.servicePrincipals.synchronization.jobs.schema(
          servicePrincipalId,
          jobId,
        ),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async updateCredentials(
    servicePrincipalId: string,
    credentials: { key: string; value: string }[],
    logger?: ApiLogger,
  ): Promise<void | { alreadyExists: true }> {
    return microsoftApiClient.put<void | { alreadyExists: true }>(
      microsoftGraphUrls.servicePrincipals.synchronization.secrets(
        servicePrincipalId,
      ),
      { value: credentials },
      logger,
    );
  },

  async startJob(
    servicePrincipalId: string,
    jobId: string,
    logger?: ApiLogger,
  ): Promise<void | { alreadyExists: true }> {
    return microsoftApiClient.post<void | { alreadyExists: true }>(
      microsoftGraphUrls.servicePrincipals.synchronization.jobs.start(
        servicePrincipalId,
        jobId,
      ),
      {},
      logger,
    );
  },

  async configureMappings(
    servicePrincipalId: string,
    jobId: string,
    schemaPayload:
      | { synchronizationRules: unknown[] }
      | Partial<SynchronizationSchema>,
    logger?: ApiLogger,
  ): Promise<SynchronizationSchema> {
    try {
      return await microsoftApiClient.put<SynchronizationSchema>(
        microsoftGraphUrls.servicePrincipals.synchronization.jobs.schema(
          servicePrincipalId,
          jobId,
        ),
        schemaPayload,
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError("Attribute mappings already configured");
      }
      throw error;
    }
  },
};
