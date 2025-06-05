import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { ChromeIcon, CloudIcon } from "lucide-react";
import { redirect } from "next/navigation";

// Server Component: LoginPage
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  // Use the custom auth() helper, which returns the session (or null)
  const session = await auth();
  // If both providers are authenticated, redirect to dashboard
  if (session?.hasGoogleAuth && session?.hasMicrosoftAuth) {
    redirect("/");
  }

  // Get error from searchParams
  const error = searchParams?.error as string | undefined;
  let errorMessage = "";
  if (error) {
    if (error === "GoogleAdminRequired")
      errorMessage = "You need Google Super Admin access to continue";
    else if (error === "MicrosoftAdminRequired")
      errorMessage = "You need Microsoft Global Admin access to continue";
    else if (error === "SignInInformationMissing")
      errorMessage = "Something went wrong. Please try signing in again.";
    else if (error === "TokenNotFound")
      errorMessage =
        "Your previous session was invalid. Please sign in again to both services.";
    else errorMessage = "Authentication failed. Please try again.";
  }

  // Initial values for form fields
  const initialDomain = "";
  const initialTenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || "";

  // Render the login form (all logic is now handled via server actions or progressive enhancement)
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Sign in to get started
          </CardTitle>
          <CardDescription>
            Enter your Google Workspace domain and Microsoft Tenant ID, then
            sign in as an admin to both services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <p className="text-center text-sm text-red-500 font-medium">
              {errorMessage}
            </p>
          )}
          {/* The form below should be progressively enhanced with client-side JS for best UX */}
          <form
            action="/login/auth"
            method="POST"
            className="space-y-4 rounded-md border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div>
              <Label htmlFor="domain-login" className="text-base font-semibold">
                Google Workspace domain
              </Label>
              <Input
                id="domain-login"
                name="domain"
                placeholder="yourcompany.com"
                defaultValue={initialDomain}
                className="mt-1 text-base"
                required
              />
            </div>
            <div>
              <Label
                htmlFor="tenantId-login"
                className="text-base font-semibold"
              >
                Microsoft Tenant ID
              </Label>
              <Input
                id="tenantId-login"
                name="tenantId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                defaultValue={initialTenantId}
                className="mt-1 text-base"
                required
              />
              {initialTenantId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tenant ID is pre-configured.
                </p>
              )}
            </div>
            <div className="pt-2 text-center text-xl font-semibold">
              Sign in to both services
            </div>
            <div className="space-y-4">
              <Button
                type="submit"
                name="provider"
                value="google"
                className="w-full text-base py-6"
              >
                <ChromeIcon className="mr-2 h-5 w-5" />
                Sign in with Google
              </Button>
              <Button
                type="submit"
                name="provider"
                value="microsoft"
                className="w-full text-base py-6"
              >
                <CloudIcon className="mr-2 h-5 w-5" />
                Sign in with Microsoft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
