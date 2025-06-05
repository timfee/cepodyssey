import { googleApiClient } from "../client";
import { googleDirectoryUrls, API_BASES } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { DirectoryUser } from "../types";
import type { ApiLogger } from "../../api-logger";

export const users = {
  async get(userKey: string, logger?: ApiLogger): Promise<DirectoryUser | null> {
    try {
      const res = await googleApiClient.get<DirectoryUser>(
        googleDirectoryUrls.users.get(userKey),
        logger,
      );
      return res ?? null;
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async create(user: Partial<DirectoryUser>, logger?: ApiLogger): Promise<DirectoryUser> {
    try {
      return await googleApiClient.post<DirectoryUser>(
        googleDirectoryUrls.users.create(),
        user,
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError(`User '${user.primaryEmail}' already exists`);
      }
      throw error;
    }
  },

  async list(
    params?: { domain?: string; query?: string; orderBy?: string; maxResults?: number },
    logger?: ApiLogger,
  ): Promise<DirectoryUser[]> {
    const response = await googleApiClient.get<{ users?: DirectoryUser[] }>(
      googleDirectoryUrls.users.list(params),
      logger,
    );
    return response.users ?? [];
  },

  async getLoggedIn(logger?: ApiLogger): Promise<DirectoryUser> {
    const profile = await googleApiClient.get<{ email: string }>(
      `${API_BASES.googleOAuth}/userinfo`,
      logger,
    );
    return (await this.get(profile.email, logger)) as DirectoryUser;
  },
};
