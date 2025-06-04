"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, type ReactElement } from "react";
import { Logger } from "@/lib/utils/logger";

export interface ErrorDialogProps {
  error: {
    title: string;
    message: string;
    code?: string;
    provider?: "google" | "microsoft" | "both";
    details?: Record<string, unknown>;
    diagnostics?: {
      timestamp: string;
      stepId?: string;
      stepTitle?: string;
      sessionInfo?: {
        hasGoogleAuth: boolean;
        hasMicrosoftAuth: boolean;
        domain?: string;
        tenantId?: string;
      };
      apiResponse?: {
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
        body?: unknown;
      };
      stackTrace?: string;
      environment?: {
        nodeEnv: string;
        logLevel: string;
      };
    };
    actions?: Array<{
      label: string;
      onClick: () => void;
      variant?: "default" | "outline" | "destructive";
      icon?: React.ReactNode;
    }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Displays a detailed error dialog with optional diagnostics information.
 */
export function ErrorDialog({
  error,
  open,
  onOpenChange,
}: ErrorDialogProps): ReactElement {
  const [showDiag, setShowDiag] = useState(false);

  const handleCopy = (): void => {
    if (error.diagnostics) {
      navigator.clipboard.writeText(JSON.stringify(error.diagnostics, null, 2));
      Logger.info("[UI]", "Diagnostics copied to clipboard");
    }
  };

  const dismissible = error.actions && error.actions.length > 0;

  return (
    <Dialog open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{error.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{error.message}</p>
          {error.actions?.length ? (
            <div className="flex gap-2">
              {error.actions.map((action) => (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  variant={action.variant}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
          {error.diagnostics ? (
            <Collapsible open={showDiag} onOpenChange={setShowDiag}>
              <CollapsibleTrigger>
                <Button variant="outline">
                  {showDiag ? "Hide Diagnostics" : "Show Diagnostics"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 max-h-60 overflow-auto text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(error.diagnostics, null, 2)}
                </pre>
                <Button variant="outline" className="mt-2" onClick={handleCopy}>
                  Copy
                </Button>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
