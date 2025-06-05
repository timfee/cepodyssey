import { auth } from "@/app/(auth)/auth";
import { AutomationDashboard } from "@/components/dashboard";
import { InitialConfigLoader } from "@/components/initial-config-loader";
import { RouteGuard } from "@/components/route-guard";

/**
 * Server component that renders the automation dashboard once both providers
 * are authenticated.
 */
export default async function Page() {
  const session = await auth();

  const domain = session?.authFlowDomain ?? null;
  const tenantId = session?.microsoftTenantId ?? null;

  return (
    <RouteGuard>
      <InitialConfigLoader domain={domain} tenantId={tenantId} />
      <AutomationDashboard serverSession={session} />
    </RouteGuard>
  );
}
