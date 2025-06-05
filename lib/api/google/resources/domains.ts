import { googleApiClient } from "../client";
import { googleDirectoryUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { GoogleDomain } from "../types";
import type { ApiLogger } from "../../api-logger";

const DEFAULT_CUSTOMER = "my_customer";

export const domains = {
  async add(domainName: string, customerId = DEFAULT_CUSTOMER, logger?: ApiLogger): Promise<GoogleDomain> {
    try {
      return await googleApiClient.post<GoogleDomain>(
        googleDirectoryUrls.domains.create(customerId),
        { domainName },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError(`Domain '${domainName}' already exists`);
      }
      throw error;
    }
  },

  async get(domainName: string, customerId = DEFAULT_CUSTOMER, logger?: ApiLogger): Promise<GoogleDomain | null> {
    try {
      return await googleApiClient.get<GoogleDomain>(
        googleDirectoryUrls.domains.get(customerId, domainName),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async isVerified(domainName: string, logger?: ApiLogger): Promise<boolean> {
    try {
      const res = await this.get(domainName, DEFAULT_CUSTOMER, logger);
      return Boolean(res?.verified);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return false;
      throw error;
    }
  },
};
