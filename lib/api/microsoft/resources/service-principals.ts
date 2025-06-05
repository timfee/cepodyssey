import { microsoftApiClient } from "../client";
import { microsoftGraphUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { ServicePrincipal, AppRoleAssignment } from "../types";
import type { ApiLogger } from "../../api-logger";

/** Helpers for working with Microsoft service principals. */
export const servicePrincipals = {
  async getByAppId(appId: string, logger?: ApiLogger): Promise<ServicePrincipal | null> {
    try {
      const res = await microsoftApiClient.get<{ value: ServicePrincipal[] }>(
        microsoftGraphUrls.servicePrincipals.list(`appId eq '${appId}'`),
        logger,
      );
      return res.value[0] ?? null;
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async get(spObjectId: string, logger?: ApiLogger): Promise<ServicePrincipal | null> {
    try {
      return await microsoftApiClient.get<ServicePrincipal>(
        microsoftGraphUrls.servicePrincipals.get(spObjectId),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async update(
    spObjectId: string,
    body: Partial<ServicePrincipal>,
    logger?: ApiLogger,
  ): Promise<void | { alreadyExists: true }> {
    try {
      await microsoftApiClient.patch<void>(
        microsoftGraphUrls.servicePrincipals.update(spObjectId),
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

  async assignUsers(
    servicePrincipalId: string,
    principalId: string,
    appRoleId: string,
    logger?: ApiLogger,
  ): Promise<AppRoleAssignment> {
    try {
      return await microsoftApiClient.post<AppRoleAssignment>(
        microsoftGraphUrls.servicePrincipals.appRoleAssignments.create(
          servicePrincipalId,
        ),
        {
          principalId,
          resourceId: servicePrincipalId,
          appRoleId,
        },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError("Principal already assigned to app");
      }
      throw error;
    }
  },

  async listAssignments(
    servicePrincipalObjectId: string,
    logger?: ApiLogger,
  ): Promise<AppRoleAssignment[]> {
    const res = await microsoftApiClient.get<{ value: AppRoleAssignment[] }>(
      microsoftGraphUrls.servicePrincipals.appRoleAssignments.list(
        servicePrincipalObjectId,
      ),
      logger,
    );
    return res.value ?? [];
  },
};
