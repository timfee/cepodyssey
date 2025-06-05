import { googleApiClient } from "../client";
import { googleDirectoryUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { GoogleRole, GoogleRoleAssignment } from "../types";
import type { ApiLogger } from "../../api-logger";

const DEFAULT_CUSTOMER = "my_customer";

export const roles = {
  async list(customerId = DEFAULT_CUSTOMER, logger?: ApiLogger): Promise<GoogleRole[]> {
    const res = await googleApiClient.get<{ items?: GoogleRole[] }>(
      googleDirectoryUrls.roles.list(customerId),
      logger,
    );
    return res.items ?? [];
  },

  async assign(
    userEmail: string,
    roleId: string,
    customerId = DEFAULT_CUSTOMER,
    logger?: ApiLogger,
  ): Promise<GoogleRoleAssignment> {
    try {
      return await googleApiClient.post<GoogleRoleAssignment>(
        googleDirectoryUrls.roles.assignments.create(customerId),
        { roleId, assignedTo: userEmail, scopeType: "CUSTOMER" },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError(`Admin role '${roleId}' already assigned to ${userEmail}`);
      }
      throw error;
    }
  },

  async listAssignments(
    userKey: string,
    customerId = DEFAULT_CUSTOMER,
    logger?: ApiLogger,
  ): Promise<GoogleRoleAssignment[]> {
    const res = await googleApiClient.get<{ items?: GoogleRoleAssignment[] }>(
      googleDirectoryUrls.roles.assignments.list(customerId, userKey),
      logger,
    );
    return res.items ?? [];
  },
};
