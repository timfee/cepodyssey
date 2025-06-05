import { googleApiClient } from "../client";
import { googleDirectoryUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { GoogleOrgUnit } from "../types";
import type { ApiLogger } from "../../api-logger";

const DEFAULT_CUSTOMER = "my_customer";

export const orgUnits = {
  async list(customerId = DEFAULT_CUSTOMER, logger?: ApiLogger): Promise<GoogleOrgUnit[]> {
    const res = await googleApiClient.get<{ organizationUnits?: GoogleOrgUnit[] }>(
      googleDirectoryUrls.orgUnits.list(customerId),
      logger,
    );
    return res.organizationUnits ?? [];
  },

  async create(
    name: string,
    parentOrgUnitPath = "/",
    customerId = DEFAULT_CUSTOMER,
    logger?: ApiLogger,
  ): Promise<GoogleOrgUnit> {
    try {
      return await googleApiClient.post<GoogleOrgUnit>(
        googleDirectoryUrls.orgUnits.create(customerId),
        { name, parentOrgUnitPath },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError(`Org unit '${name}' already exists`);
      }
      throw error;
    }
  },

  async get(
    ouPath: string,
    customerId = DEFAULT_CUSTOMER,
    logger?: ApiLogger,
  ): Promise<GoogleOrgUnit | null> {
    try {
      const relativePath = ouPath.startsWith("/") ? ouPath.substring(1) : ouPath;
      if (!relativePath && ouPath === "/") return null;
      return await googleApiClient.get<GoogleOrgUnit>(
        googleDirectoryUrls.orgUnits.get(customerId, relativePath),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },
};
