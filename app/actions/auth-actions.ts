"use server";

interface TenantLookupResult {
  success: boolean;
  tenantId?: string;
  message: string;
}

/**
 * Discovers the Microsoft Tenant ID for a given domain by checking the
 * OpenID Connect configuration.
 */
export async function lookupTenantId(
  domain: string
): Promise<TenantLookupResult> {
  if (!domain) {
    return { success: false, message: "Domain is required." };
  }

  const url = `https://login.microsoftonline.com/${domain}/.well-known/openid-configuration`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!response.ok) {
      return {
        success: false,
        message: `Could not find a tenant for domain '${domain}'. Please enter the Tenant ID manually.`,
      };
    }
    const config = (await response.json()) as { issuer?: string };
    const issuerMatch = /https?:\/\/sts\.windows\.net\/([^/]+)\//i.exec(
      config.issuer ?? ""
    );
    const tenantId = issuerMatch?.[1];

    if (tenantId) {
      return { success: true, tenantId, message: "Tenant ID discovered." };
    }
    return {
      success: false,
      message: "Could not determine Tenant ID from the domain.",
    };
  } catch (error) {
    console.error("Tenant ID lookup failed:", error);
    return { success: false, message: "An error occurred during lookup." };
  }
}
