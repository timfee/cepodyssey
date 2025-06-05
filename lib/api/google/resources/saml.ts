import { googleApiClient } from "../client";
import { googleIdentityUrls } from "../../url-builder";
import { AlreadyExistsError } from "../../errors";
import { APIError } from "../../utils";
import type { InboundSamlSsoProfile, SsoAssignment, IdpCredential } from "../types";
import type { ApiLogger } from "../../api-logger";

export const saml = {
  async createProfile(displayName: string, logger?: ApiLogger): Promise<InboundSamlSsoProfile> {
    try {
      const res = await googleApiClient.post<{ done: boolean; response: InboundSamlSsoProfile }>(
        googleIdentityUrls.samlProfiles.create(),
        { displayName },
        logger,
      );
      if (!res.done || !res.response) {
        throw new APIError("Invalid response from createSamlProfile", 500);
      }
      return res.response;
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError(`SAML profile '${displayName}' already exists`);
      }
      throw error;
    }
  },

  async getProfile(profileFullName: string, logger?: ApiLogger): Promise<InboundSamlSsoProfile | null> {
    try {
      return await googleApiClient.get<InboundSamlSsoProfile>(
        googleIdentityUrls.samlProfiles.get(profileFullName),
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 404) return null;
      throw error;
    }
  },

  async listProfiles(logger?: ApiLogger): Promise<InboundSamlSsoProfile[]> {
    const res = await googleApiClient.get<{ inboundSamlSsoProfiles?: InboundSamlSsoProfile[] }>(
      googleIdentityUrls.samlProfiles.list(),
      logger,
    );
    return res.inboundSamlSsoProfiles ?? [];
  },

  async updateProfile(
    profileFullName: string,
    config: Partial<Pick<InboundSamlSsoProfile, "idpConfig">>,
    logger?: ApiLogger,
  ): Promise<InboundSamlSsoProfile | { alreadyExists: true }> {
    const updateMaskPaths: string[] = [];
    if (config.idpConfig) updateMaskPaths.push("idpConfig");
    const updateMask = updateMaskPaths.join(",");
    try {
      return await googleApiClient.patch<InboundSamlSsoProfile>(
        googleIdentityUrls.samlProfiles.update(profileFullName, updateMask),
        config,
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        return { alreadyExists: true };
      }
      throw error;
    }
  },

  async assignToOrgUnits(
    profileFullName: string,
    assignments: SsoAssignment[],
    logger?: ApiLogger,
  ): Promise<object> {
    try {
      return await googleApiClient.post<object>(
        googleIdentityUrls.samlProfiles.assignToOrgUnits(profileFullName),
        { assignments },
        logger,
      );
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        throw new AlreadyExistsError("SAML profile already assigned to OU");
      }
      throw error;
    }
  },

  async addIdpCredentials(profileFullName: string, pemData?: string, logger?: ApiLogger): Promise<{ success: boolean }> {
    return googleApiClient.post<{ success: boolean }>(
      googleIdentityUrls.samlProfiles.idpCredentials.add(profileFullName),
      pemData ? { pemData } : {},
      logger,
    );
  },

  async listIdpCredentials(profileFullName: string, logger?: ApiLogger): Promise<IdpCredential[]> {
    const res = await googleApiClient.get<{ idpCredentials?: IdpCredential[] }>(
      googleIdentityUrls.samlProfiles.idpCredentials.list(profileFullName),
      logger,
    );
    return res.idpCredentials ?? [];
  },
};
