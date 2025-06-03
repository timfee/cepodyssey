import { auth } from "@/app/(auth)/auth";
import { AutomationDashboard } from "@/components/dashboard";
import type { AppConfigState as AppConfigTypeFromTypes } from "@/lib/types";
import { redirect } from "next/navigation";

/**
 * Server component that renders the automation dashboard once both providers
 * are authenticated.
 */
export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?reason=unauthenticated");
  }

  // Redirect if either provider is missing.
  if (!session.hasGoogleAuth || !session.hasMicrosoftAuth) {
    const queryParams = new URLSearchParams();
    if (!session.hasGoogleAuth && !session.hasMicrosoftAuth)
      queryParams.set("reason", "both_identities_missing");
    else if (!session.hasGoogleAuth)
      queryParams.set("reason", "google_auth_missing");
    else queryParams.set("reason", "microsoft_auth_missing");
    redirect(`/login?${queryParams.toString()}`);
  }

  // Prepare configuration for the dashboard from the session
  const initialConfig: Partial<AppConfigTypeFromTypes> = {
    domain: session.authFlowDomain ?? null,
    tenantId: session.microsoftTenantId ?? null,
    outputs: {},
  };
  console.log(
    "app/page.tsx: Passing initialConfig to dashboard from session:",
    initialConfig,
  );

  return (
    <AutomationDashboard
      serverSession={session}
      initialConfig={initialConfig}
    />
  );
}
