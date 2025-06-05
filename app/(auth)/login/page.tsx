"use client";

import {
  CheckCircleIcon,
  ChromeIcon,
  CloudIcon,
  Loader2Icon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState, useTransition } from "react";

import { lookupTenantId } from "@/app/actions/auth-actions";
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
import { config } from "@/lib/config";
import { Logger } from "@/lib/utils/logger";
import { cleanupInvalidSession } from "../auth";
import { handleGoogleLogin, handleMicrosoftLogin } from "./actions";

/**
 * Interactive login page used to connect administrator accounts for both
 * providers before accessing the dashboard.
 */
function LoginPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [domain, setDomain] = useState("");
  const [tenantId, setTenantId] = useState(
    config.NEXT_PUBLIC_MICROSOFT_TENANT_ID || "",
  );
  const [isTenantDiscovered, setIsTenantDiscovered] = useState(false);
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  const [isGooglePending, startGoogleLoginTransition] = useTransition();
  const [isMicrosoftPending, startMicrosoftLoginTransition] = useTransition();

  // Redirect when both providers are authenticated
  useEffect(() => {
    if (session?.hasGoogleAuth && session.hasMicrosoftAuth) {
      Logger.info(
        '[LoginPage]',
        'Both providers authenticated. Redirecting to dashboard.',
      );
      router.replace("/");
    }
  }, [session, router]);

  // Display authentication errors
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      if (error === "GoogleAdminRequired")
        errorMessage = "You need Google Super Admin access to continue";
      if (error === "MicrosoftAdminRequired")
        errorMessage = "You need Microsoft Global Admin access to continue";
      if (error === "SignInInformationMissing")
        errorMessage = "Something went wrong. Please try signing in again.";
      if (error === "TokenNotFound") {
        cleanupInvalidSession();
        errorMessage =
          "Your previous session was invalid. Please sign in again to both services.";
      }
      Logger.error('[LoginPage]', errorMessage);
    }
  }, [searchParams]);

  // Handle auth errors from redirects
  useEffect(() => {
    const authAttempt = searchParams.get("authAttempt");
    const error = searchParams.get("error");

    if (authAttempt && !error && sessionStatus === "authenticated") {
      if (authAttempt === "google" && !session?.hasGoogleAuth) {
        Logger.error('[LoginPage]', 'Google authentication failed. Please try again.');
      } else if (authAttempt === "microsoft" && !session?.hasMicrosoftAuth) {
        Logger.error('[LoginPage]', 'Microsoft authentication failed. Please try again.');
      }
    }
  }, [searchParams, session, sessionStatus]);

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
      Logger.error('[LoginPage]', 'Please enter a domain first to lookup Tenant ID.');
      return;
    }
    setIsLookingUpTenant(true);
    setLookupMessage("");
    const result = await lookupTenantId(domain);
    if (result.success && result.tenantId) {
      setTenantId(result.tenantId);
      setIsTenantDiscovered(true);
      setLookupMessage(`Tenant ID found: ${result.tenantId}`);
      Logger.info('[LoginPage]', 'Tenant ID discovered!');
    } else {
      setLookupMessage(result.message || "Could not auto-discover Tenant ID.");
      Logger.error('[LoginPage]', result.message || 'Tenant ID lookup failed.');
    }
    setIsLookingUpTenant(false);
  };

  const onGoogleSignIn = () => {
    if (!domain) {
      Logger.error('[LoginPage]', 'Please enter your domain first');
      return;
    }
    startGoogleLoginTransition(async () => {
      const formData = new FormData();
      formData.append("domain", domain);
      await handleGoogleLogin(formData);
    });
  };

  const onMicrosoftSignIn = () => {
    const effectiveTenantId = tenantId || config.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    // Domain is optional for MS login but used as hint when provided
    if (!effectiveTenantId && !config.MICROSOFT_TENANT_ID) {
      Logger.info('[LoginPage]', 'No Tenant ID found. Using default Microsoft sign-in.');
    }
    startMicrosoftLoginTransition(async () => {
      const formData = new FormData();
      if (domain) formData.append("domain", domain);
      if (effectiveTenantId) formData.append("tenantId", effectiveTenantId);
      await handleMicrosoftLogin(formData);
    });
  };

  const isLoadingOverall =
    sessionStatus === "loading" || isGooglePending || isMicrosoftPending;
  const isGoogleButtonDisabled =
    isLoadingOverall || !domain || (session?.hasGoogleAuth ?? false);
  const isMicrosoftButtonDisabled =
    isLoadingOverall ||
    (!tenantId &&
      !config.NEXT_PUBLIC_MICROSOFT_TENANT_ID &&
      !config.MICROSOFT_TENANT_ID) ||
    (session?.hasMicrosoftAuth ?? false);

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
          <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div>
              <Label htmlFor="domain-login" className="text-base font-semibold">
                Google Workspace domain
              </Label>
              <Input
                id="domain-login"
                name="domain"
                placeholder="yourcompany.com"
                value={domain}
                onChange={handleDomainChange}
                className="mt-1 text-base"
                disabled={isLoadingOverall || session?.hasGoogleAuth}
              />
            </div>
            <div>
              <Label
                htmlFor="tenantId-login"
                className="text-base font-semibold"
              >
                Microsoft Tenant ID
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="tenantId-login"
                  name="tenantId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={tenantId}
                  onChange={handleTenantIdChange}
                  className={`text-base ${
                    isTenantDiscovered ? "border-green-500" : ""
                  }`}
                  disabled={
                    isLoadingOverall ||
                    !!config.NEXT_PUBLIC_MICROSOFT_TENANT_ID ||
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
                    !!config.NEXT_PUBLIC_MICROSOFT_TENANT_ID ||
                    session?.hasMicrosoftAuth
                  }
                  className="shrink-0"
                >
                  {isLookingUpTenant ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : null}{" "}
                  Find
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
              {config.NEXT_PUBLIC_MICROSOFT_TENANT_ID && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tenant ID is pre-configured.
                </p>
              )}
            </div>
          </div>
          <CardTitle className="pt-2 text-center text-xl font-semibold">
            Sign in to both services
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
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Suspense boundary for the login page.
 * This separates the server and client components.
 */
export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4">Loading login page...</div>}>
      <LoginPage />
    </Suspense>
  );
}
