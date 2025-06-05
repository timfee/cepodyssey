import { auth } from "@/app/(auth)/auth";
import { AutomationDashboard } from "@/components/dashboard";
import { InitialConfigLoader } from "@/components/initial-config-loader";
import { redirect } from "next/navigation";
import { RouteGuard } from "@/components/route-guard";

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

  const domain = session.authFlowDomain ?? null;
  const tenantId = session.microsoftTenantId ?? null;

  return (
    <RouteGuard>
      <InitialConfigLoader domain={domain} tenantId={tenantId} />
      <AutomationDashboard serverSession={session} />
    </RouteGuard>
  );
}
