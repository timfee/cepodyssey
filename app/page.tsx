import { AutomationDashboard } from "@/components/dashboard";
import { InitialConfigLoader } from "@/components/initial-config-loader";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Server component rendering the automation dashboard.
 */
export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.hasGoogleAuth || !session.hasMicrosoftAuth) {
    redirect("/login");
  }

  return (
    <>
      <InitialConfigLoader
        domain={session.authFlowDomain}
        tenantId={session.microsoftTenantId}
      />
      <AutomationDashboard
        initialSession={{
          user: session.user,
          hasGoogleAuth: session.hasGoogleAuth,
          hasMicrosoftAuth: session.hasMicrosoftAuth,
        }}
      />
    </>
  );
}
