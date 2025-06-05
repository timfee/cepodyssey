import { fetchWithAuth } from "../../auth-interceptor";
import { microsoftAuthUrls } from "../../url-builder";
import { APIError } from "../../utils";
import type { SamlMetadata } from "../types";
import type { ApiLogger } from "../../api-logger";

export const saml = {
  async getMetadata(
    tenantId: string,
    appId: string,
    logger?: ApiLogger,
  ): Promise<SamlMetadata> {
    const url = microsoftAuthUrls.samlMetadata(tenantId, appId);
    const res = await fetchWithAuth(url, {}, "microsoft", logger);
    if (!res.ok) {
      throw new APIError(`Failed to fetch SAML metadata: ${res.statusText}`, res.status);
    }
    const xml = await res.text();
    const entityIdMatch = /entityID="([^"]+)"/.exec(xml);
    const ssoUrlMatch = /SingleSignOnService[^>]*Location="([^"]+)"/.exec(xml);
    const certMatch = /<X509Certificate>([^<]+)<\/X509Certificate>/.exec(xml);
    if (!entityIdMatch?.[1] || !ssoUrlMatch?.[1] || !certMatch?.[1]) {
      throw new APIError("Could not parse SAML metadata XML.", 500);
    }
    return {
      entityId: entityIdMatch[1],
      ssoUrl: ssoUrlMatch[1],
      certificate: certMatch[1],
    };
  },
};
