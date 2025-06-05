"use client";

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import {
  toggleDebugPanel,
  selectFilteredLogs,
} from "@/lib/redux/slices/debug-panel";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { isApiDebugEnabled } from "@/lib/utils";

export function DebugPanelNub() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.debugPanel.isOpen);
  const logs = useAppSelector(selectFilteredLogs);

  const debugDisabled = !isApiDebugEnabled();

  if (debugDisabled || isOpen) {
    return null;
  }

  const errorCount = logs.filter(
    (log) => log.error || (log.responseStatus && log.responseStatus >= 400),
  ).length;

  return (
    <Button
      variant="outline"
      className="fixed bottom-4 right-4 h-auto py-2 px-4 rounded-lg shadow-lg z-50 flex items-center bg-card hover:bg-muted text-sm"
      onClick={() => dispatch(toggleDebugPanel())}
      aria-label="Open API Debug Panel"
    >
      <Terminal className="h-4 w-4 mr-2" />
      API Logs
      {errorCount > 0 && (
        <span className="ml-2 text-xs text-destructive">({errorCount})</span>
      )}
    </Button>
  );
}
