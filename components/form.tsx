"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { lookupTenantId } from "@/app/actions/auth-actions";
import { saveConfig } from "@/app/actions/config-actions";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { setDomain, setTenantId } from "@/lib/redux/slices/app-config";

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
  domain: z.string().regex(DOMAIN_REGEX, "Invalid domain format."),
  tenantId: z.string().uuid("Invalid Tenant ID format (must be a UUID)."),
});
type ConfigFormData = z.infer<typeof configFormSchema>;

export function ConfigForm() {
  const dispatch = useAppDispatch();
  const { domain, tenantId } = useAppSelector((state) => state.appConfig);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isLookingUp, setIsLookingUp] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    values: {
      domain: domain ?? "",
      tenantId: tenantId ?? "",
    },
    mode: "onBlur",
  });

  const watchedDomain = form.watch("domain");

  const handleLookup = async () => {
    if (!watchedDomain || !DOMAIN_REGEX.test(watchedDomain)) {
      toast.error("Please enter a valid domain to look up the Tenant ID.");
      return;
    }
    setIsLookingUp(true);
    const result = await lookupTenantId(watchedDomain);
    if (result.success && result.tenantId) {
      form.setValue("tenantId", result.tenantId, { shouldValidate: true });
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsLookingUp(false);
  };

  const onSubmit = (data: ConfigFormData) => {
    startSubmitTransition(async () => {
      const result = await saveConfig(data);
      if (result.success) {
        dispatch(setDomain(data.domain));
        dispatch(setTenantId(data.tenantId));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initial Configuration</CardTitle>
        <CardDescription>
          Provide your primary Google Workspace domain and Microsoft Entra ID
          Tenant ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="domain">Primary Domain</Label>
            <Input
              id="domain"
              placeholder="yourcompany.com"
              {...form.register("domain")}
            />
            {form.formState.errors.domain && (
              <p className="text-sm text-destructive">
                {form.formState.errors.domain.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantId">Microsoft Tenant ID</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tenantId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                {...form.register("tenantId")}
              />
              <Button
                type="button"
                onClick={handleLookup}
                variant="outline"
                disabled={isLookingUp || !watchedDomain}
              >
                {isLookingUp && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lookup
              </Button>
            </div>
            {form.formState.errors.tenantId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.tenantId.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
