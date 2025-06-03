// ./app/(auth)/login/page.tsx
"use client";

import {
  CheckCircleIcon,
  ChromeIcon,
  CloudIcon,
  Loader2Icon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

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
import { handleGoogleLogin, handleMicrosoftLogin } from "./actions";

export default function LoginPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [domain, setDomain] = useState(""); // For Google 'hd' param
  const [tenantId, setTenantId] = useState(
    process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || ""
  ); // For Microsoft login if not fixed by env
  const [isTenantDiscovered, setIsTenantDiscovered] = useState(false);
  const [isLookingUpTenant, setIsLookingUpTenant] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  const [isGooglePending, startGoogleLoginTransition] = useTransition();
  const [isMicrosoftPending, startMicrosoftLoginTransition] = useTransition();

  // Effect to redirect if both providers are authenticated
  useEffect(() => {
    if (session?.hasGoogleAuth && session.hasMicrosoftAuth) {
      console.log(
        "LoginPage: Both providers authenticated. Redirecting to dashboard."
      );
      router.replace("/"); // Redirect to dashboard
    }
  }, [session, router]);

  // Effect to display authentication errors
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      if (error === "GoogleAdminRequired")
        errorMessage =
          "Sign-in failed: Google Super Administrator privileges required.";
      if (error === "MicrosoftAdminRequired")
        errorMessage =
          "Sign-in failed: Microsoft Global Administrator privileges required.";
      if (error === "SignInInformationMissing")
        errorMessage = "Sign-in failed: Essential user information missing.";
      toast.error(errorMessage, {
        id: `login-error-${error}`,
        duration: 10000,
      });
    }
  }, [searchParams]);

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
      setLookupMessage(result.message || "Could not auto-discover Tenant ID.");
      toast.error(result.message || "Tenant ID lookup failed.");
    }
    setIsLookingUpTenant(false);
  };

  const onGoogleSignIn = () => {
    if (!domain) {
      toast.error(
        "Primary Google Workspace domain is required for Google Sign-In."
      );
      return;
    }
    startGoogleLoginTransition(async () => {
      const formData = new FormData();
      formData.append("domain", domain);
      await handleGoogleLogin(formData);
    });
  };

  const onMicrosoftSignIn = () => {
    const effectiveTenantId =
      tenantId || process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    // Domain is optional for MS login, but good as a hint if available
    if (!effectiveTenantId && !process.env.MICROSOFT_TENANT_ID) {
      toast.info(
        "Microsoft Tenant ID is not specified. Attempting sign-in with common endpoint.",
        { duration: 7000 }
      );
    }
    startMicrosoftLoginTransition(async () => {
      const formData = new FormData();
      if (domain) formData.append("domain", domain); // domain_hint
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
            First, enter your Google Workspace domain (for Google sign-in) and
            optionally your Microsoft Tenant ID (or use lookup). Then, sign in
            to both services with administrator privileges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div>
              <Label htmlFor="domain-login" className="text-base font-semibold">
                1. Primary Google Workspace Domain
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
                2. Microsoft Entra ID Tenant ID
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
                  ) : null}{" "}
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
                  Tenant ID is pre-configured.
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
        </CardContent>
      </Card>
    </div>
  );
}
