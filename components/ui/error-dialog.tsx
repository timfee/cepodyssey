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
import { useState } from "react";
import { Logger } from "@/lib/utils/logger";
import { useErrorActions } from "@/hooks/use-error-actions";
import type { ErrorInfo } from "@/lib/redux/slices/errors";

export interface ErrorDialogProps {
  error: ErrorInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ErrorDialog({ error, open, onOpenChange }: ErrorDialogProps) {
  const [showDiag, setShowDiag] = useState(false);
  const { resolveAction } = useErrorActions();

  const handleCopy = (): void => {
    if (error.diagnostics) {
      navigator.clipboard.writeText(JSON.stringify(error.diagnostics, null, 2));
      Logger.info("[UI]", "Diagnostics copied to clipboard");
    }
  };

  const hasActions = error.actions && error.actions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>{error.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{error.message}</p>
          <div className="flex gap-2 justify-end">
            {hasActions ? (
              error.actions!.map((action, index) => {
                const resolvedAction = resolveAction(action);
                return (
                  <Button
                    key={`${action.label}-${index}`}
                    onClick={resolvedAction.onClick}
                    variant={resolvedAction.variant || "default"}
                  >
                    {resolvedAction.icon}
                    {resolvedAction.label}
                  </Button>
                );
              })
            ) : (
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Dismiss
              </Button>
            )}
          </div>
          {error.diagnostics && (
            <Collapsible open={showDiag} onOpenChange={setShowDiag}>
              <CollapsibleTrigger>
                <Button variant="ghost" size="sm" className="w-full">
                  {showDiag ? "Hide" : "Show"} Diagnostics
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 max-h-60 overflow-auto text-xs">
                <pre className="whitespace-pre-wrap bg-muted p-2 rounded">
                  {JSON.stringify(error.diagnostics, null, 2)}
                </pre>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleCopy}>
                  Copy
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
