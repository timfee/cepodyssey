"use server";

import { auth } from "@/app/(auth)/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

// This matches the structure expected by getConfig in app/dashboard/page.tsx
// and aligns with AppConfigState in Redux for consistency.
interface AppConfig {
  domain: string;
  tenantId: string;
  outputs?: Record<string, unknown>; // Added to store step outputs
}

const ConfigSchema = z.object({
  domain: z.string().regex(DOMAIN_REGEX, "Invalid domain format."),
  tenantId: z.string().uuid("Tenant ID must be a valid UUID."),
  outputs: z.record(z.unknown()).optional(), // Outputs from steps
});

interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

// In-memory store for demonstration, as per the original project structure for these actions.
// For a multi-instance production app, a database (e.g., Redis, Postgres) would be used.
const serverSideConfigStore = new Map<string, AppConfig>();

/**
 * Saves the application configuration (domain, tenantId, and step outputs)
 * for the authenticated user to an in-memory store.
 */
export async function saveConfig(data: AppConfig): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      success: false,
      error: "User not authenticated or email missing.",
    };
  }

  const result = ConfigSchema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors.map((e) => e.message).join(" ");
    return { success: false, error: errorMessage };
  }

  serverSideConfigStore.set(session.user.email, result.data);
  console.log(`Configuration saved for ${session.user.email}:`, result.data);

  // Revalidate the dashboard path so getConfig in DashboardPage can pick up changes.
  revalidatePath("/dashboard");

  return { success: true, message: "Configuration saved successfully." };
}

/**
 * Retrieves the application configuration for the authenticated user
 * from the in-memory store.
 */
export async function getConfig(): Promise<AppConfig | null> {
  const session = await auth();
  if (!session?.user?.email) {
    console.log("getConfig: No session or user email found.");
    return null;
  }

  const config = serverSideConfigStore.get(session.user.email);
  if (config) {
    console.log(`Configuration retrieved for ${session.user.email}:`, config);
    return config;
  } else {
    console.log(
      `No configuration found in server-side store for ${session.user.email}.`
    );
    return null;
  }
}
