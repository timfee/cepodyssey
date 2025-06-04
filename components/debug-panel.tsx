"use client";

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import {
  selectDebugPanel,
  selectFilteredLogs,
  toggleDebugPanel,
  openDebugPanel,
  clearLogs,
  setFilter,
  type DebugPanelState,
  ApiLogEntry,
} from "@/lib/redux/slices/debug-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BugIcon,
  XIcon,
  TrashIcon,
  CopyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DebugPanel() {
  const dispatch = useAppDispatch();
  const { isOpen, filter } = useAppSelector(selectDebugPanel);
  const logs = useAppSelector(selectFilteredLogs);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const debugDisabled = !process.env.NEXT_PUBLIC_ENABLE_API_DEBUG;

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyLog = (log: ApiLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
  };

  const getStatusColor = (status?: number) => {
    if (!status) return "text-gray-500";
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-blue-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    return "text-red-600";
  };

  const errorCount = logs.filter(
    (log) => log.error || (log.responseStatus && log.responseStatus >= 400),
  ).length;

  // Auto-open panel when there are errors
  useEffect(() => {
    if (debugDisabled) return;
    if (errorCount > 0 && !isOpen) {
      dispatch(openDebugPanel());
    }
  }, [errorCount, isOpen, dispatch, debugDisabled]);

  if (debugDisabled) {
    return null;
  }

  const showProdWarning =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_API_DEBUG;

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch(toggleDebugPanel())}
          className={cn("shadow-lg", errorCount > 0 && "border-red-500")}
        >
          <BugIcon className="h-4 w-4 mr-2" />
          API Debug
          {errorCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {errorCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg max-h-[50vh] flex flex-col">
      {showProdWarning && (
        <div className="bg-red-500 text-white text-center text-xs py-1">
          Debug mode is enabled
        </div>
      )}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BugIcon className="h-5 w-5" />
            API Debug Panel
          </h3>
          <Tabs
            value={filter}
            onValueChange={(v) =>
              dispatch(setFilter(v as DebugPanelState["filter"]))
            }
          >
            <TabsList>
              <TabsTrigger value="all">All ({logs.length})</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
              <TabsTrigger value="errors">Errors ({errorCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch(clearLogs())}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch(toggleDebugPanel())}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No API requests logged yet
            </p>
          ) : (
            logs.map((log) => (
              <Collapsible
                key={log.id}
                open={expandedLogs.has(log.id)}
                onOpenChange={() => toggleLogExpansion(log.id)}
              >
                <div
                  className={cn(
                    "border rounded-lg p-3",
                    log.error && "border-red-500 bg-red-50 dark:bg-red-950/20",
                  )}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                        {log.responseStatus && (
                          <span
                            className={cn(
                              "text-sm font-mono",
                              getStatusColor(log.responseStatus),
                            )}
                          >
                            {log.responseStatus}
                          </span>
                        )}
                        {log.duration && (
                          <span className="text-xs text-muted-foreground">
                            {log.duration}ms
                          </span>
                        )}
                        <span className="text-sm truncate max-w-[400px]">
                          {log.url}
                        </span>
                        {log.error && (
                          <AlertCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {expandedLogs.has(log.id) ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {log.headers && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Headers</h4>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.requestBody !== undefined && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">
                          Request Body
                        </h4>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.responseBody !== undefined && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1">
                          Response Body
                        </h4>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
                          {JSON.stringify(log.responseBody, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.error && (
                      <div>
                        <h4 className="text-sm font-semibold mb-1 text-red-600">
                          Error
                        </h4>
                        <pre className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          {log.error}
                        </pre>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyLog(log)}
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copy Log
                    </Button>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
