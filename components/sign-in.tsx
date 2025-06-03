"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChromeIcon, CloudIcon, LogIn } from "lucide-react";

interface ProviderSignInBlockProps {
  providerName: "Google Workspace" | "Microsoft Entra ID";
  isConnected: boolean;
}

/**
 * Simple card showing the sign-in status for a provider.
 */
export function ProviderSignInBlock({
  providerName,
  isConnected,
}: ProviderSignInBlockProps) {
  const Icon = providerName === "Google Workspace" ? ChromeIcon : CloudIcon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{providerName}</CardTitle>
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>Connected</span>
          </div>
        ) : (
          <Button type="submit" className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
