import { microsoftApiClient } from "../client";
import { microsoftGraphUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { Application, ServicePrincipal } from "../types";
import type { ApiLogger } from "../../api-logger";

export const templates = {
  async createEnterpriseApp(
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
