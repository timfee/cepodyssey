// ./app/(auth)/login/page.tsx
"use client";

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ChromeIcon,
  CloudIcon,
  Loader2Icon,
  LogInIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { lookupTenantId } from "@/app/actions/auth-actions";
import { saveConfig } from "@/app/actions/config-actions"; // For saving config before redirect
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
import { handleGoogleLogin, handleMicrosoftLogin } from "./actions";

export default function LoginPage() {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [domain, setDomain] = useState("");
  // Pre-fill tenantId if NEXT_PUBLIC_MICROSOFT_TENANT_ID is available (e.g. for specific deployments)
  // Otherwise, it starts empty for user input/discovery.
  const [tenantId, setTenantId] = useState(
    process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || ""
  );
  const [isTenantDiscovered, setIsTenantDiscovered] = useState(false);
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  const [isGooglePending, startGoogleLoginTransition] = useTransition();
  const [isMicrosoftPending, startMicrosoftLoginTransition] = useTransition();
  const [isSavingConfig, startSavingConfigTransition] = useTransition();

  // Effect to handle redirection once both providers are authenticated and config is saved
  useEffect(() => {
    if (session?.hasGoogleAuth && session.hasMicrosoftAuth) {
      // Config should be saved before redirecting. This effect might run multiple times.
      // The actual save and redirect is now triggered by the onSuccessfulDualLogin function.
    }
  }, [session, router]);

  // Effect to display authentication errors from URL parameters
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      if (error === "GoogleAdminRequired")
        errorMessage =
          "Sign-in failed: Google Super Administrator privileges required for the provided account.";
      if (error === "MicrosoftAdminRequired")
        errorMessage =
          "Sign-in failed: Microsoft Global Administrator privileges required for the provided account.";
      if (error === "SignInInformationMissing")
        errorMessage =
          "Sign-in failed: Essential user information was missing.";
      toast.error(errorMessage, {
        id: `login-error-${error}`,
        duration: 10000,
      });
      router.replace("/login", { scroll: false }); // Clear error from URL to prevent re-toast on refresh
    }
  }, [searchParams, router]);

  // New function to handle actions after both providers are logged in
  const onSuccessfulDualLogin = React.useCallback(async () => {
    if (
      !domain ||
      (!tenantId && !process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID)
    ) {
      toast.error(
        "Domain and Tenant ID must be set before proceeding to the dashboard."
      );
      // Potentially force re-auth for the second provider if config was missing
      // or prompt user to fill fields and re-attempt the second login.
      return;
    }

    startSavingConfigTransition(async () => {
      const finalTenantId =
        tenantId || process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      if (!finalTenantId) {
        // Should be caught by above check but as a safeguard
        toast.error("Microsoft Tenant ID is missing.");
        return;
      }
      const result = await saveConfig({
        domain,
        tenantId: finalTenantId,
        outputs: {},
      }); // Save to server-side store
      if (result.success) {
        toast.success("Configuration saved. Redirecting to dashboard...");
        router.replace("/dashboard");
      } else {
        toast.error(
          `Failed to save configuration: ${result.error || "Unknown error"}`
        );
        // User is authenticated with both, but config didn't save. What to do?
        // Maybe allow proceeding but warn that config might be lost or try saving again.
        // For now, we block redirect if save fails.
      }
    });
  }, [domain, tenantId, router]);

  // Check if dual login is complete and trigger save/redirect
  useEffect(() => {
    if (session?.hasGoogleAuth && session.hasMicrosoftAuth && !isSavingConfig) {
      onSuccessfulDualLogin();
    }
  }, [session, onSuccessfulDualLogin, isSavingConfig]);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
    setIsTenantDiscovered(false);
    setLookupMessage("");
  };

  const handleTenantIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTenantId(e.target.value);
    setIsTenantDiscovered(false);
  };

  const onLookupTenant = async () => {
    if (!domain) {
      toast.error("Please enter a domain first to lookup Tenant ID.");
      return;
    }
    setIsLookingUpTenant(true);
    setLookupMessage("");
    const result = await lookupTenantId(domain);
    if (result.success && result.tenantId) {
      setTenantId(result.tenantId);
      setIsTenantDiscovered(true);
      setLookupMessage(`Tenant ID found: ${result.tenantId}`);
      toast.success("Tenant ID discovered!");
    } else {
      setLookupMessage(
        result.message || "Could not auto-discover Tenant ID for the domain."
      );
      toast.error(result.message || "Tenant ID lookup failed.");
    }
    setIsLookingUpTenant(false);
  };

  const onGoogleSignIn = () => {
    if (!domain) {
      toast.error(
        "Primary Google Workspace domain is required before signing in."
      );
      return;
    }
    startGoogleLoginTransition(async () => {
      const formData = new FormData();
      formData.append("domain", domain);
      // Persist domain to localStorage so if they complete Google auth and then
      // browser crashes/navigates away, it's remembered on login page reload.
      localStorage.setItem("loginPageDomain", domain);
      if (tenantId) localStorage.setItem("loginPageTenantId", tenantId);
      await handleGoogleLogin(formData);
      await updateSession(); // Refresh session data after sign-in attempt
    });
  };

  const onMicrosoftSignIn = () => {
    const effectiveTenantId =
      tenantId || process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (!effectiveTenantId && !process.env.MICROSOFT_TENANT_ID) {
      // Check both public and private env var for preconfig
      toast.info(
        "Microsoft Tenant ID is not specified. Attempting sign-in with common endpoint. You may need to select your organization or sign in with an account from the desired tenant.",
        { duration: 7000 }
      );
    }
    if (!domain && effectiveTenantId) {
      toast.warning(
        "Providing the primary domain can help streamline Microsoft sign-in (as a domain hint)."
      );
    }
    startMicrosoftLoginTransition(async () => {
      const formData = new FormData();
      if (domain) formData.append("domain", domain);
      if (effectiveTenantId) formData.append("tenantId", effectiveTenantId);

      localStorage.setItem("loginPageDomain", domain);
      if (tenantId) localStorage.setItem("loginPageTenantId", tenantId);

      await handleMicrosoftLogin(formData);
      await updateSession(); // Refresh session data
    });
  };

  // Effect to load domain/tenantId from localStorage on initial mount
  useEffect(() => {
    const savedDomain = localStorage.getItem("loginPageDomain");
    const savedTenantId = localStorage.getItem("loginPageTenantId");
    if (savedDomain && !domain) {
      // only if not already set (e.g. by state init from env var)
      setDomain(savedDomain);
    }
    if (savedTenantId && !tenantId) {
      // only if not already set
      setTenantId(savedTenantId);
    }
  }, []); // Empty dependency array means this runs once on mount

  const isLoadingOverall =
    sessionStatus === "loading" ||
    isGooglePending ||
    isMicrosoftPending ||
    isSavingConfig;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Connect Your Admin Accounts
          </CardTitle>
          <CardDescription>
            First, enter your Google Workspace domain and Microsoft Tenant ID.
            Then, sign in to both services with administrator privileges to
            proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div>
              <Label htmlFor="domain" className="text-base font-semibold">
                1. Primary Google Workspace Domain
              </Label>
              <Input
                id="domain"
                name="domain"
                placeholder="yourcompany.com"
                value={domain}
                onChange={handleDomainChange}
                className="mt-1 text-base"
                disabled={isLoadingOverall || session?.hasGoogleAuth} // Disable if Google auth is done
              />
            </div>
            <div>
              <Label htmlFor="tenantId" className="text-base font-semibold">
                2. Microsoft Entra ID Tenant ID
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="tenantId"
                  name="tenantId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={tenantId}
                  onChange={handleTenantIdChange}
                  className={`text-base ${
                    isTenantDiscovered ? "border-green-500" : ""
                  }`}
                  disabled={
                    isLoadingOverall ||
                    !!process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID ||
                    session?.hasMicrosoftAuth
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLookupTenant}
                  disabled={
                    isLoadingOverall ||
                    !domain ||
                    isLookingUpTenant ||
                    !!process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID ||
                    session?.hasMicrosoftAuth
                  }
                  className="shrink-0"
                >
                  {isLookingUpTenant ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : null}
                  Lookup
                </Button>
              </div>
              {lookupMessage && (
                <p
                  className={`mt-1 text-xs ${
                    isTenantDiscovered ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {lookupMessage}
                </p>
              )}
              {process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tenant ID is pre-configured for this application instance.
                </p>
              )}
            </div>
          </div>

          <CardTitle className="pt-2 text-center text-xl font-semibold">
            3. Sign In to Services
          </CardTitle>
          <div className="space-y-4">
            <Button
              onClick={onGoogleSignIn}
              disabled={
                isLoadingOverall || !domain || session?.hasGoogleAuth === true
              }
              className="w-full text-base py-6"
              variant={session?.hasGoogleAuth ? "secondary" : "default"}
            >
              {isGooglePending && (
                <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
              )}
              {!isGooglePending && session?.hasGoogleAuth && (
                <CheckCircleIcon className="mr-2 h-5 w-5 text-green-500" />
              )}
              {!isGooglePending && !session?.hasGoogleAuth && (
                <ChromeIcon className="mr-2 h-5 w-5" />
              )}
              {session?.hasGoogleAuth
                ? "Google Workspace Connected"
                : "Sign in with Google"}
            </Button>

            <Button
              onClick={onMicrosoftSignIn}
              disabled={
                isLoadingOverall ||
                (!tenantId && !process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID) ||
                session?.hasMicrosoftAuth === true
              }
              className="w-full text-base py-6"
              variant={session?.hasMicrosoftAuth ? "secondary" : "default"}
            >
              {isMicrosoftPending && (
                <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
              )}
              {!isMicrosoftPending && session?.hasMicrosoftAuth && (
                <CheckCircleIcon className="mr-2 h-5 w-5 text-green-500" />
              )}
              {!isMicrosoftPending && !session?.hasMicrosoftAuth && (
                <CloudIcon className="mr-2 h-5 w-5" />
              )}
              {session?.hasMicrosoftAuth
                ? "Microsoft Entra ID Connected"
                : "Sign in with Microsoft"}
            </Button>
          </div>

          {sessionStatus === "loading" && (
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Checking
              session...
            </p>
          )}

          {isSavingConfig && (
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving
              configuration and preparing dashboard...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
