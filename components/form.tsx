// ./components/form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import React, { useEffect, useState, useTransition } from "react"; // Imported React
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { lookupTenantId } from "@/app/actions/auth-actions";
import { saveConfig } from "@/app/actions/config-actions";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux"; // Corrected path
import {
  setDomain, // Corrected import name from appConfigSlice
  setTenantId, // Corrected import name from appConfigSlice
} from "@/lib/redux/slices/app-config"; // Corrected slice name
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
    .min(1, "Tenant ID is required.") // Making Tenant ID effectively required for saving.
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

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      // defaultValues are only used for the initial render.
      domain: currentAppConfig.domain ?? "",
      tenantId: currentAppConfig.tenantId ?? "",
    },
    mode: "onBlur",
  });

  // Effect to explicitly update/reset form values when Redux state changes.
  // This ensures the form displays the Redux state if it's populated from server/login.
  useEffect(() => {
    if (!form.formState.isDirty) {
      // Only reset if user isn't actively editing
      form.reset({
        domain: currentAppConfig.domain ?? "",
        tenantId: currentAppConfig.tenantId ?? "",
      });
    }
  }, [
    currentAppConfig.domain,
    currentAppConfig.tenantId,
    form,
    form.formState.isDirty,
  ]);

  const watchedDomain = form.watch("domain");

  const handleLookup = async () => {
    const currentDomainValue = form.getValues("domain");
    if (!currentDomainValue || !DOMAIN_REGEX.test(currentDomainValue)) {
      toast.error("Please enter a valid domain to look up the Tenant ID.");
      form.setError("domain", {
        type: "manual",
        message: "Valid domain required for lookup.",
      });
      return;
    }
    form.clearErrors("domain");
    setIsLookingUp(true);
    const result = await lookupTenantId(currentDomainValue);
    if (result.success && result.tenantId) {
      form.setValue("tenantId", result.tenantId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setIsTenantDiscovered(true);
      toast.success(result.message || "Tenant ID discovered!");
    } else {
      toast.error(result.message || "Tenant ID lookup failed.");
      form.setError("tenantId", {
        type: "lookup",
        message: result.message || "Could not auto-discover.",
      });
      setIsTenantDiscovered(false);
    }
    setIsLookingUp(false);
  };

  const onSubmit: SubmitHandler<ConfigFormData> = (data) => {
    // Ensure tenantId is truly a UUID string if provided, or handle optional case if schema allows
    if (!data.tenantId && !process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID) {
      toast.error(
        "Microsoft Tenant ID is required. Please enter or look it up."
      );
      form.setError("tenantId", {
        type: "manual",
        message: "Tenant ID is required.",
      });
      return;
    }

    startSubmitTransition(async () => {
      dispatch(setDomain(data.domain));
      dispatch(setTenantId(data.tenantId)); // Dispatch the validated tenantId

      const serverSaveResult = await saveConfig({
        domain: data.domain,
        tenantId: data.tenantId, // Send the validated tenantId
        outputs: currentAppConfig.outputs, // Persist existing outputs
      });

      if (serverSaveResult.success) {
        toast.success(
          serverSaveResult.message ?? "Configuration saved successfully!"
        );
        form.reset(data); // Reset form with submitted data, clearing isDirty
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
      {" "}
      {/* Added mb-6 as per your new `project-code.md` which showed it on auth-status */}
      <CardHeader>
        <CardTitle className="text-xl">Initial Configuration</CardTitle>
        <CardDescription>
          Provide your primary Google Workspace domain and Microsoft Entra ID
          Tenant ID. This information is required to proceed with the
          automation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="domain">Primary Google Workspace Domain</Label>
            <Input
              id="domain"
              placeholder="yourcompany.com"
              {...form.register("domain")}
              className={
                form.formState.errors.domain
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {form.formState.errors.domain && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.domain.message}
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
                  {...form.register("tenantId")}
                  className={`${
                    form.formState.errors.tenantId
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  } ${
                    isTenantDiscovered && !form.formState.errors.tenantId
                      ? "border-green-500"
                      : ""
                  }`}
                  onInput={() => setIsTenantDiscovered(false)}
                />
                {form.formState.errors.tenantId && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.tenantId.message}
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
                  !!form.formState.errors.domain
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
                  Tenant ID is pre-configured for this application instance.
                </p>
              )}
          </div>
          <Button
            type="submit"
            disabled={
              isSubmitting || !form.formState.isDirty || !form.formState.isValid
            }
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
