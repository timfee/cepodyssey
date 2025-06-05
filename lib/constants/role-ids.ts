/**
 * Identifiers for key administrator roles across providers.
 */
export const GOOGLE_SUPER_ADMIN_ROLE_ID = "3";

/** Global administrator role template ID for Microsoft Entra ID. */
import { config } from "@/lib/config";

export const MICROSOFT_GLOBAL_ADMIN_ROLE_TEMPLATE_ID =
  config.MICROSOFT_GLOBAL_ADMIN_ROLE_TEMPLATE_ID;
