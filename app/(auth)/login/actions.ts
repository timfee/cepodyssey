"use server";

import { signIn } from "@/app/(auth)/auth";
import { SignInOptions } from "next-auth/react";

/**
 * Start the Google sign‑in flow via NextAuth.
 * `domain` is passed as the `hd` hint when provided.
 */
export async function handleGoogleLogin(formData: FormData): Promise<void> {
  const domain = formData.get("domain") as string | null;

  const signInOptions: SignInOptions & { hd?: string } = {
    redirectTo: "/login?authAttempt=google",
  };

  await signIn("google", signInOptions, {
    hd: domain ?? "",
  });
}

/**
 * Start the Microsoft sign‑in flow via NextAuth. Domain and tenant ID are used
 * as hints when provided.
 */
export async function handleMicrosoftLogin(formData: FormData): Promise<void> {
  const domain = formData.get("domain") as string | null;
  const tenantId = formData.get("tenantId") as string | null;

  const signInOptions: SignInOptions & {
    tenant?: string;
    domainHint?: string;
  } = {
    redirectTo: "/login?authAttempt=microsoft",
  };

  if (domain) signInOptions.domainHint = domain;
  if (tenantId) signInOptions.tenant = tenantId;

  await signIn("microsoft-entra-id", signInOptions);
}
