"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";

interface ErrorDialogProps {
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
      recentLogs?: Array<{
        level: string;
        message: string;
        timestamp: string;
        category?: string;
      }>;
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
  isDismissible?: boolean;
}

/**
 * Error dialog component with expandable diagnostics panel.
 * Shows detailed error information and provides action buttons.
 *
 * @param props - Error dialog properties
 * @returns Error dialog component
 */
export function ErrorDialog({
  error,
  open,
  onOpenChange,
  isDismissible = true,
}: ErrorDialogProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Copies diagnostic information to clipboard as JSON.
   */
  const copyDiagnostics = async (): Promise<void> => {
    const diagnosticData = {
      error: {
        title: error.title,
        message: error.message,
        code: error.code,
        provider: error.provider,
        details: error.details,
      },
      diagnostics: error.diagnostics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    await navigator.clipboard.writeText(
      JSON.stringify(diagnosticData, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={isDismissible ? onOpenChange : undefined}>
      <DialogContent className="max-w-2xl" showCloseButton={isDismissible}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-red-500" />
            {error.title}
          </DialogTitle>
          <DialogDescription>{error.message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error.code && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Error Code:</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {error.code}
              </code>
            </div>
          )}

          {error.provider && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Provider:</span>
              <span className="capitalize">{error.provider}</span>
            </div>
          )}

          {error.diagnostics && (
            <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics}>
              <CollapsibleTrigger>
                <Button variant="outline" className="w-full justify-between">
                  <span>Show Diagnostics</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${showDiagnostics ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Diagnostic Information</h4>
                    <Button variant="ghost" size="sm" onClick={copyDiagnostics}>
                      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>

                  {error.diagnostics.timestamp && (
                    <div>
                      <span className="font-medium text-sm">Timestamp:</span>
                      <p className="text-sm text-muted-foreground">
                        {error.diagnostics.timestamp}
                      </p>
                    </div>
                  )}

                  {error.diagnostics.stepId && (
                    <div>
                      <span className="font-medium text-sm">Step:</span>
                      <p className="text-sm text-muted-foreground">
                        {error.diagnostics.stepId} - {error.diagnostics.stepTitle}
                      </p>
                    </div>
                  )}

                  {error.diagnostics.sessionInfo && (
                    <div>
                      <span className="font-medium text-sm">Session:</span>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                        {JSON.stringify(error.diagnostics.sessionInfo, null, 2)}
                      </pre>
                    </div>
                  )}

                  {error.diagnostics.apiResponse && (
                    <div>
                      <span className="font-medium text-sm">API Response:</span>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                        {JSON.stringify(error.diagnostics.apiResponse, null, 2)}
                      </pre>
                    </div>
                  )}

                  {error.diagnostics.stackTrace && (
                    <div>
                      <span className="font-medium text-sm">Stack Trace:</span>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 whitespace-pre-wrap">
                        {error.diagnostics.stackTrace}
                      </pre>
                    </div>
                  )}

                  {error.diagnostics.recentLogs && error.diagnostics.recentLogs.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Recent Logs:</span>
                      <div className="mt-1 space-y-1">
                        {error.diagnostics.recentLogs.map((log, i) => (
                          <div key={i} className="text-xs font-mono">
                            <span className="text-gray-500">[{log.timestamp}]</span>
                            <span className={`ml-1 ${log.level === "ERROR" ? "text-red-500" : log.level === "WARN" ? "text-yellow-500" : "text-gray-600"}`}>[{log.level}]</span>
                            {log.category && <span className="ml-1 text-blue-500">{log.category}</span>}
                            <span className="ml-1">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          {error.actions?.map((action, index) => (
            <Button key={index} variant={action.variant || "default"} onClick={action.onClick}>
              {action.icon}
              {action.label}
            </Button>
          )) ||
            (isDismissible && (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ErrorDialogProps };
