import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatenate class names using `clsx` and merge Tailwind overrides.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate that required step outputs are present before execution.
 *
 * @param outputs - Current step outputs object
 * @param required - Keys that must be present
 * @returns Object with validity flag and list of missing keys
 */
export function validateRequiredOutputs(
  outputs: Record<string, unknown>,
  required: string[],
): { valid: boolean; missing: string[] } {
  const missing = required.filter((k) => !outputs[k]);
  return { valid: missing.length === 0, missing };
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Constructs a Google Admin Console URL for a SAML profile
 * @param profileFullName The full resource name (e.g., "inboundSamlSsoProfiles/12345")
 * @returns The properly formatted Admin Console URL
 */
export function getGoogleSamlProfileUrl(profileFullName: string): string {
  const profileId = profileFullName.split("/").pop();
  if (!profileId) {
    return "https://admin.google.com/ac/security/sso";
  }
  // The Admin Console expects the profile ID in a URL-encoded format
  return `https://admin.google.com/ac/security/sso/sso-profiles/inboundSamlSsoProfiles%2F${profileId}`;
}

/**
 * Constructs an Azure Portal URL for an Enterprise Application
 * @param blade The specific blade/section to open
 * @param spId Service Principal Object ID
 * @param appId Application (Client) ID
 * @returns The properly formatted Azure Portal URL
 */
export function getAzurePortalUrl(
  blade:
    | "Overview"
    | "ProvisioningManagement"
    | "SingleSignOn"
    | "UsersAndGroups",
  spId: string,
  appId: string,
): string {
  const base =
    "https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~";

  switch (blade) {
    case "Overview":
    case "UsersAndGroups":
      return `${base}/${blade}/servicePrincipalId/${spId}/appId/${appId}`;
    case "ProvisioningManagement":
    case "SingleSignOn":
      return `${base}/${blade}/appId/${appId}/objectId/${spId}`;
    default:
      return `${base}/Overview/servicePrincipalId/${spId}/appId/${appId}`;
  }
}
