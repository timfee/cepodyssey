// ./components/form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import React, { useEffect, useState, useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { lookupTenantId } from "@/app/actions/auth-actions";
import { saveConfig } from "@/app/actions/config-actions";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { setDomain, setTenantId } from "@/lib/redux/slices/app-config";
import type { RootState } from "@/lib/redux/store";

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

const DOMAIN_REGEX =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

const configFormSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required.")
    .regex(DOMAIN_REGEX, "Invalid domain format. Example: yourcompany.com"),
  tenantId: z
    .string()
    .min(1, "Tenant ID is required.")
    .uuid("Invalid Tenant ID format. Must be a UUID."),
});
type ConfigFormData = z.infer<typeof configFormSchema>;

export function ConfigForm() {
  const dispatch = useAppDispatch();
  const currentAppConfig = useAppSelector(
    (state: RootState) => state.appConfig
  );

  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isTenantDiscovered, setIsTenantDiscovered] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors, isDirty, isValid: isFormValid },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      // Set initial defaults
      domain: "",
      tenantId: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    console.log(
      "ConfigForm: currentAppConfig changed in Redux:",
      currentAppConfig
    );
    // Only reset if the form is not dirty, or if the Redux values are substantially different
    // and might have come from a server load.
    if (currentAppConfig.domain || currentAppConfig.tenantId) {
      // Only reset if there's something to set
      if (
        !isDirty ||
        currentAppConfig.domain !== watch("domain") ||
        currentAppConfig.tenantId !== watch("tenantId")
      ) {
        console.log("ConfigForm: Resetting form with values from Redux:", {
          domain: currentAppConfig.domain ?? "",
          tenantId: currentAppConfig.tenantId ?? "",
        });
        reset({
          domain: currentAppConfig.domain ?? "",
          tenantId: currentAppConfig.tenantId ?? "",
        });
      }
    }
  }, [
    currentAppConfig.domain,
    currentAppConfig.tenantId,
    reset,
    isDirty,
    watch,
    currentAppConfig,
  ]);

  const watchedDomain = watch("domain");

  const handleLookup = async () => {
    const currentDomainValue = watch("domain"); // Use watched value
    if (!currentDomainValue || !DOMAIN_REGEX.test(currentDomainValue)) {
      toast.error("Please enter a valid domain to look up the Tenant ID.");
      setError("domain", {
        type: "manual",
        message: "Valid domain required for lookup.",
      });
      return;
    }
    clearErrors("domain");
    setIsLookingUp(true);
    const result = await lookupTenantId(currentDomainValue);
    if (result.success && result.tenantId) {
      setValue("tenantId", result.tenantId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setIsTenantDiscovered(true);
      toast.success(result.message || "Tenant ID discovered!");
    } else {
      toast.error(result.message || "Tenant ID lookup failed.");
      setError("tenantId", {
        type: "lookup",
        message: result.message || "Could not auto-discover.",
      });
      setIsTenantDiscovered(false);
    }
    setIsLookingUp(false);
  };

  const onSubmit: SubmitHandler<ConfigFormData> = (data) => {
    startSubmitTransition(async () => {
      dispatch(setDomain(data.domain));
      dispatch(setTenantId(data.tenantId));

      const serverSaveResult = await saveConfig({
        domain: data.domain,
        tenantId: data.tenantId,
        outputs: currentAppConfig.outputs, // Persist existing outputs
      });

      if (serverSaveResult.success) {
        toast.success(
          serverSaveResult.message ?? "Configuration saved successfully!"
        );
        reset(data); // Reset form to clear dirty state after successful save
      } else {
        toast.error(
          serverSaveResult.error?.message ??
            "Failed to save configuration to the server."
        );
      }
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Initial Configuration</CardTitle>
        <CardDescription>
          Provide your primary Google Workspace domain and Microsoft Entra ID
          Tenant ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="domain">Primary Google Workspace Domain</Label>
            <Input
              id="domain"
              placeholder="yourcompany.com"
              {...register("domain")}
              className={
                errors.domain
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {errors.domain && (
              <p className="text-sm text-destructive mt-1">
                {errors.domain.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tenantId">Microsoft Entra ID Tenant ID</Label>
            <div className="flex items-start gap-2">
              <div className="flex-grow space-y-1.5">
                <Input
                  id="tenantId"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  {...register("tenantId")}
                  className={`${
                    errors.tenantId
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  } ${
                    isTenantDiscovered && !errors.tenantId
                      ? "border-green-500"
                      : ""
                  }`}
                  onInput={() => setIsTenantDiscovered(false)}
                />
                {errors.tenantId && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.tenantId.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={handleLookup}
                variant="outline"
                disabled={
                  isSubmitting ||
                  isLookingUp ||
                  !watchedDomain ||
                  !!errors.domain
                }
                className="shrink-0"
              >
                {isLookingUp && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lookup ID
              </Button>
            </div>
            {process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID &&
              currentAppConfig.tenantId ===
                process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tenant ID is pre-configured for this application.
                </p>
              )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty || !isFormValid}
          >
            {isSubmitting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
