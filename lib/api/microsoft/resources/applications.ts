import { microsoftApiClient } from "../client";
import { microsoftGraphUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { Application, ServicePrincipal } from "../types";
import type { ApiLogger } from "../../api-logger";

export const applications = {
  async list(filter?: string, logger?: ApiLogger): Promise<Application[]> {
    const res = await microsoftApiClient.get<{ value: Application[] }>(
      microsoftGraphUrls.applications.list(filter),
      logger,
    );
    return res.value ?? [];
  },

  async get(
    appObjectId: string,
    logger?: ApiLogger,
  ): Promise<Application | null> {
    try {
      return await microsoftApiClient.get<Application>(
        microsoftGraphUrls.applications.get(appObjectId),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async update(
    appObjectId: string,
    body: Partial<Application>,
    logger?: ApiLogger,
  ): Promise<void | { alreadyExists: true }> {
    return microsoftApiClient.patch<void | { alreadyExists: true }>(
      microsoftGraphUrls.applications.update(appObjectId),
      body,
      logger,
    );
  },

  async createFromTemplate(
    templateId: string,
    displayName: string,
    logger?: ApiLogger,
  ): Promise<{ application: Application; servicePrincipal: ServicePrincipal }> {
    try {
      return await microsoftApiClient.post<{
        application: Application;
        servicePrincipal: ServicePrincipal;
      }>(
        microsoftGraphUrls.applicationTemplates.instantiate(templateId),
        { displayName },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError(
          `Enterprise app '${displayName}' already exists`,
        );
      }
      throw error;
    }
  },
};
