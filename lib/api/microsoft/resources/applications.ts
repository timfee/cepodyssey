import { microsoftApiClient } from "../client";
import { microsoftGraphUrls } from "../../url-builder";
import { APIError } from "../../utils";
import type { Application } from "../types";
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
    try {
      await microsoftApiClient.patch<void>(
        microsoftGraphUrls.applications.update(appObjectId),
        body,
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        return { alreadyExists: true };
      }
      throw error;
    }
  },
};
