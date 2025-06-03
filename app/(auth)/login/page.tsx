// ./app/(auth)/login/page.tsx
"use client";

import {
  CheckCircleIcon,
  ChromeIcon,
  CloudIcon,
  Loader2Icon,
} from "lucide-react"; // LogInIcon removed as buttons change text
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { lookupTenantId } from "@/app/actions/auth-actions";
import { saveConfig } from "@/app/actions/config-actions";
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
  const [tenantId, setTenantId] = useState(
    process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || ""
  );
  const [isTenantDiscovered, setIsTenantDiscovered] = useState(false);
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  const [isGooglePending, startGoogleLoginTransition] = useTransition();
  const [isMicrosoftPending, startMicrosoftLoginTransition] = useTransition();
  const [isSavingConfig, startSavingConfigTransition] = useTransition();

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
      // Add more specific error messages as needed from NextAuth errors
      toast.error(errorMessage, {
        id: `login-error-${error}`,
        duration: 10000,
      });
      // Removed router.replace here to allow toast to be seen and error to persist in URL for debugging.
      // User can manually remove it or it will be cleared on next successful navigation.
    }
  }, [searchParams]); // Only re-run if searchParams change

  const onSuccessfulDualLogin = React.useCallback(async () => {
    if (isSavingConfig) return; // Prevent duplicate saves if already in progress

    const finalDomain = domain || localStorage.getItem("loginPageDomain") || "";
    let finalTenantId =
      tenantId ||
      localStorage.getItem("loginPageTenantId") ||
      process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID ||
      "";

    if (!finalDomain) {
      toast.error(
        "Primary Google Workspace domain is missing. Please enter it."
      );
      return;
    }
    if (!finalTenantId && !process.env.MICROSOFT_TENANT_ID) {
      // Check against the actual env var if public one is not set
      toast.error(
        "Microsoft Entra ID Tenant ID is missing. Please enter it or use the lookup feature."
      );
      return;
    }
    if (!finalTenantId && process.env.MICROSOFT_TENANT_ID) {
      // If set in server .env but not in UI state
      finalTenantId = process.env.MICROSOFT_TENANT_ID; // This won't work client side, rely on public or UI
    }

    startSavingConfigTransition(async () => {
      // Use tenantId from state, which could be user-input, discovered, or prefilled from NEXT_PUBLIC_ env var
      const effectiveTenantIdForSave =
        tenantId || process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || "";
      if (!effectiveTenantIdForSave) {
        toast.error(
          "Microsoft Tenant ID is still missing for saving configuration."
        );
        return;
      }

      const result = await saveConfig({
        domain: finalDomain,
        tenantId: effectiveTenantIdForSave,
        outputs: {},
      });
      if (result.success) {
        toast.success("Configuration saved. Redirecting to dashboard...");
        localStorage.removeItem("loginPageDomain"); // Clean up temp storage
        localStorage.removeItem("loginPageTenantId");
        router.replace("/");
      } else {
        toast.error(
          `Failed to save configuration: ${
            result.error || "Unknown error"
          }. You are authenticated with both services but initial configuration could not be saved. Please proceed to the dashboard and save configuration there.`
        );
        // Allow redirect to dashboard even if saveConfig fails here, dashboard can handle it.
        router.replace("/?configSaveError=true");
      }
    });
  }, [domain, tenantId, router, isSavingConfig]);

  useEffect(() => {
    if (session?.hasGoogleAuth && session.hasMicrosoftAuth && !isSavingConfig) {
      onSuccessfulDualLogin();
    }
  }, [session, onSuccessfulDualLogin, isSavingConfig]);

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDomain = e.target.value;
    setDomain(newDomain);
    localStorage.setItem("loginPageDomain", newDomain); // Persist immediately for resilience
    setIsTenantDiscovered(false);
    setLookupMessage("");
  };

  const handleTenantIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTenantId = e.target.value;
    setTenantId(newTenantId);
    localStorage.setItem("loginPageTenantId", newTenantId); // Persist immediately
    setIsTenantDiscovered(false);
  };

  const onLookupTenant = async () => {
    const currentDomain = domain || localStorage.getItem("loginPageDomain");
    if (!currentDomain) {
      toast.error("Please enter a domain first to lookup Tenant ID.");
      return;
    }
    setIsLookingUpTenant(true);
    setLookupMessage("");
    const result = await lookupTenantId(currentDomain);
    if (result.success && result.tenantId) {
      setTenantId(result.tenantId);
      localStorage.setItem("loginPageTenantId", result.tenantId);
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
    const currentDomain = domain || localStorage.getItem("loginPageDomain");
    if (!currentDomain) {
      toast.error(
        "Primary Google Workspace domain is required before signing in."
      );
      return;
    }
    startGoogleLoginTransition(async () => {
      const formData = new FormData();
      formData.append("domain", currentDomain);
      await handleGoogleLogin(formData);
      // No need to call updateSession() here, NextAuth redirect will trigger session update on page load.
    });
  };

  const onMicrosoftSignIn = () => {
    const currentDomain = domain || localStorage.getItem("loginPageDomain");
    let effectiveTenantId =
      tenantId ||
      localStorage.getItem("loginPageTenantId") ||
      process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;

    if (!effectiveTenantId && !process.env.MICROSOFT_TENANT_ID) {
      toast.info(
        "Microsoft Tenant ID is not specified. Attempting sign-in with common endpoint.",
        { duration: 7000 }
      );
    }
    startMicrosoftLoginTransition(async () => {
      const formData = new FormData();
      if (currentDomain) formData.append("domain", currentDomain);
      if (effectiveTenantId) formData.append("tenantId", effectiveTenantId);
      await handleMicrosoftLogin(formData);
    });
  };

  useEffect(() => {
    const savedDomain = localStorage.getItem("loginPageDomain");
    const savedTenantId = localStorage.getItem("loginPageTenantId");
    if (savedDomain && !domain) setDomain(savedDomain);
    if (
      savedTenantId &&
      !tenantId &&
      !process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID
    )
      setTenantId(savedTenantId);
    // If NEXT_PUBLIC_MICROSOFT_TENANT_ID is set, it initializes `tenantId` state, so don't override with localStorage unless localStorage is different and more specific.
    // This logic is a bit tricky if env var should always take precedence. Current logic pre-fills from env, then localStorage can fill if env is not there.
  }, []);

  const isLoadingButtons =
    sessionStatus === "loading" ||
    isGooglePending ||
    isMicrosoftPending ||
    isSavingConfig;
  const isGoogleButtonDisabled =
    isLoadingButtons || !domain || (session?.hasGoogleAuth ?? false);
  const isMicrosoftButtonDisabled =
    isLoadingButtons ||
    (!tenantId &&
      !process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID &&
      !process.env.MICROSOFT_TENANT_ID) ||
    (session?.hasMicrosoftAuth ?? false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Connect Your Admin Accounts
          </CardTitle>
          <CardDescription>
            First, enter your Google Workspace domain and Microsoft Tenant ID.
            Then, sign in to both services with appropriate administrator
            privileges to proceed.
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
                disabled={isLoadingButtons || session?.hasGoogleAuth}
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
                    isLoadingButtons ||
                    !!process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID ||
                    session?.hasMicrosoftAuth
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLookupTenant}
                  disabled={
                    isLoadingButtons ||
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
              disabled={isGoogleButtonDisabled}
              className="w-full text-base py-6"
              variant={session?.hasGoogleAuth ? "outline" : "default"}
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
              disabled={isMicrosoftButtonDisabled}
              className="w-full text-base py-6"
              variant={session?.hasMicrosoftAuth ? "outline" : "default"}
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

          {sessionStatus === "loading" &&
            !isGooglePending &&
            !isMicrosoftPending && (
              <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
                Initializing session...
              </p>
            )}

          {isSavingConfig && (
            <p className="text-center text-sm text-muted-foreground flex items-center justify-center">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Finalizing
              setup and redirecting...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
