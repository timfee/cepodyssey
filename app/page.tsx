import { auth } from "@/app/(auth)/auth";
import { AutomationDashboard } from "@/components/dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  // If the user isn't authenticated at all, send them to the login page.
  // The login page will handle guiding them to connect both accounts.
  if (!session?.user) {
    redirect("/login");
  }

  // Pass the initial server-side session to the main client component.
  // This avoids a flash of unauthenticated content.
  return <AutomationDashboard serverSession={session} />;
}
