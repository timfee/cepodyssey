"use server";

import { auth } from "@/lib/auth";
import { Logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";
import isFQDN from "validator/lib/isFQDN";
import { z } from "zod";
export interface ActionResult<TData = Record<string, unknown> | null> {
  success: boolean;
  data?: TData;
  error?: { message: string; code?: string };
  message?: string;
}

interface AppConfig {
  /** Domain and tenant ID mirror the Redux AppConfigState structure. */
  domain: string;
  tenantId: string;
  outputs?: Record<string, unknown>;
}

const ConfigSchema = z.object({
  domain: z.string().refine((d) => isFQDN(d), {
    message: "Invalid domain format.",
  }),
  tenantId: z.string().uuid("Tenant ID must be a valid UUID."),
  outputs: z.record(z.unknown()).optional(),
});

const CONFIG_STORE_KEY = "admin_user_app_config";
const serverSideConfigStore = new Map<string, AppConfig>();

/**
 * Persist the provided configuration for the current user session.
 */
export async function saveConfig(data: AppConfig): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      error: { message: "User not authenticated." },
    };
  }

  const result = ConfigSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(" ");
    return { success: false, error: { message: errorMessage } };
  }

  serverSideConfigStore.set(CONFIG_STORE_KEY, result.data);
  Logger.info(
    "[ConfigActions]",
    `Configuration saved with key '${CONFIG_STORE_KEY}':`,
    result.data
  );

  revalidatePath("/");

  return { success: true, message: "Configuration saved successfully." };
}

/**
 * Retrieve the persisted configuration for the current user session.
 */
export async function getConfig(): Promise<AppConfig | null> {
  const session = await auth();
  if (!session?.user) {
    Logger.warn(
      "[ConfigActions]",
      "getConfig: No session or user found. Cannot retrieve config."
    );
    return null;
  }
  const config = serverSideConfigStore.get(CONFIG_STORE_KEY);
  if (config) {
    Logger.debug(
      "[ConfigActions]",
      `getConfig: Configuration retrieved for key '${CONFIG_STORE_KEY}':`,
      config
    );
    return config;
  } else {
    Logger.debug(
      "[ConfigActions]",
      `getConfig: No configuration found in server-side store for key '${CONFIG_STORE_KEY}'.`
    );
    return null;
  }
}
