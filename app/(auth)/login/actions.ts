"use server";

import { signIn } from "@/app/(auth)/auth";
import { SignInOptions } from "next-auth/react";

export async function handleGoogleLogin(formData: FormData): Promise<void> {
  const domain = formData.get("domain") as string | null;

  const signInOptions: SignInOptions & { hd?: string } = {
    // This specifies where NextAuth should redirect *after* Google authenticates
    // and calls back to your /api/auth/callback/google endpoint.
    redirectTo: "/login?authAttempt=google",
  };

  if (domain) {
    signInOptions.hd = domain; // Pass hosted domain parameter to Google
  }

  // Allow signIn() to throw NEXT_REDIRECT for Next.js to handle the actual redirect to Google
  await signIn("google", signInOptions);
  // Code here might not be reached if signIn initiates a redirect.
}

export async function handleMicrosoftLogin(formData: FormData): Promise<void> {
  const domain = formData.get("domain") as string | null; // For domain_hint
  const tenantId = formData.get("tenantId") as string | null; // Specific tenant for login

  const signInOptions: SignInOptions & {
    tenant?: string;
    domainHint?: string;
  } = {
    // This specifies where NextAuth should redirect *after* Microsoft authenticates
    // and calls back to your /api/auth/callback/microsoft-entra-id endpoint.
    redirectTo: "/login?authAttempt=microsoft",
  };

  if (domain) {
    signInOptions.domainHint = domain;
  }
  if (tenantId) {
    signInOptions.tenant = tenantId;
  }

  // Allow signIn() to throw NEXT_REDIRECT for Next.js to handle the actual redirect to Microsoft
  await signIn("microsoft-entra-id", signInOptions);
  // Code here might not be reached if signIn initiates a redirect.
}
