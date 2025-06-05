"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAppSelector } from "@/hooks/use-redux";
import type { RootState } from "@/lib/redux/store";

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
    .regex(DOMAIN_REGEX, "Invalid domain format.")
    .optional()
    .nullable(),
  tenantId: z.string().uuid("Invalid Tenant ID format.").optional().nullable(),
});
type ConfigFormData = z.infer<typeof configFormSchema>;
/**
 * Read-only form displaying the domain and tenant ID from Redux state.
 */

export function ConfigForm() {
  const currentAppConfig = useAppSelector(
    (state: RootState) => state.app,
  );

  const {
    register,
    reset,
    formState: { errors },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      domain: currentAppConfig.domain ?? "",
      tenantId: currentAppConfig.tenantId ?? "",
    },
  });

  // Reset form fields when Redux state changes.
  useEffect(() => {
    console.log(
      "ConfigForm: Resetting/populating form with Redux state:",
      currentAppConfig,
    );
    reset({
      domain: currentAppConfig.domain ?? "",
      tenantId: currentAppConfig.tenantId ?? "",
    });
  }, [
    currentAppConfig,
    currentAppConfig.domain,
    currentAppConfig.tenantId,
    reset,
  ]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Your settings</CardTitle>
        <CardDescription>
          These values were detected from your sign-in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="displayDomain">Google domain</Label>
          <Input
            id="displayDomain"
            {...register("domain")}
            readOnly
            disabled
            className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
          />
          {errors.domain && (
            <p className="text-sm text-destructive mt-1">
              {errors.domain.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="displayTenantId">Microsoft Tenant ID</Label>
          <Input
            id="displayTenantId"
            {...register("tenantId")}
            readOnly
            disabled
            className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
          />
          {errors.tenantId && (
            <p className="text-sm text-destructive mt-1">
              {errors.tenantId.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
