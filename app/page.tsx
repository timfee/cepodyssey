// ./app/page.tsx (Main Dashboard Page)
import { auth } from "@/app/(auth)/auth";
// getConfig is no longer needed here for domain/tenantId
import { AutomationDashboard } from "@/components/dashboard";
import type { AppConfigState as AppConfigTypeFromTypes } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    // Simplified check: if no user, redirect to login
    redirect("/login?reason=unauthenticated");
    return null;
  }

  // If partially authenticated, login page should handle guidance.
  // If fully authenticated, proceed to dashboard.
  if (!session.hasGoogleAuth || !session.hasMicrosoftAuth) {
    const queryParams = new URLSearchParams();
    if (!session.hasGoogleAuth && !session.hasMicrosoftAuth)
      queryParams.set("reason", "both_identities_missing");
    else if (!session.hasGoogleAuth)
      queryParams.set("reason", "google_auth_missing");
    else queryParams.set("reason", "microsoft_auth_missing");
    redirect(`/login?${queryParams.toString()}`);
    return null;
  }

  // Prepare initialConfig for AutomationDashboard from session
  const initialConfig: Partial<AppConfigTypeFromTypes> = {
    domain: session.authFlowDomain ?? null, // From Google 'hd' claim in JWT
    tenantId: session.microsoftTenantId ?? null, // From Microsoft 'tid' claim in JWT
    outputs: {}, // Outputs will be loaded from domain-keyed localStorage on client
  };
  console.log(
    "app/page.tsx: Passing initialConfig to dashboard from session:",
    initialConfig
  );

  return (
    <AutomationDashboard
      serverSession={session}
      initialConfig={initialConfig}
    />
  );
}
