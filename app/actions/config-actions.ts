"use server";

import { auth } from "@/app/(auth)/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ActionResult<TData = Record<string, unknown> | null> {
  success: boolean;
  data?: TData;
  error?: { message: string; code?: string };
  message?: string;
}

const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

interface AppConfig {
  /** Domain and tenant ID mirror the Redux AppConfigState structure. */
  domain: string;
  tenantId: string;
  outputs?: Record<string, unknown>;
}

const ConfigSchema = z.object({
  domain: z.string().regex(DOMAIN_REGEX, "Invalid domain format."),
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
  console.log(
    `Configuration saved with key '${CONFIG_STORE_KEY}':`,
    result.data,
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
    console.log("getConfig: No session or user found. Cannot retrieve config.");
    return null;
  }
  const config = serverSideConfigStore.get(CONFIG_STORE_KEY);
  if (config) {
    console.log(
      `getConfig: Configuration retrieved for key '${CONFIG_STORE_KEY}':`,
      config,
    );
    return config;
  } else {
    console.log(
      `getConfig: No configuration found in server-side store for key '${CONFIG_STORE_KEY}'.`,
    );
    return null;
  }
}
