"use client"

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux"
import {
  selectDebugPanel,
  selectFilteredLogs,
  toggleDebugPanel,
  clearLogs,
  setFilter,
  type DebugPanelState,
  type ApiLogEntry,
} from "@/lib/redux/slices/debug-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bug, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { isApiDebugEnabled } from "@/lib/utils"

export function DebugPanel() {
  const dispatch = useAppDispatch()
  const { isOpen, filter } = useAppSelector(selectDebugPanel)
  const logs = useAppSelector(selectFilteredLogs)

  const debugDisabled = !isApiDebugEnabled()

  if (debugDisabled || !isOpen) {
    return null
  }

  const getLogCount = (filterType: DebugPanelState["filter"]) => {
    if (filterType === "all") return logs.length
    if (filterType === "errors")
      return logs.filter(
        (log) => log.error || (log.responseStatus && log.responseStatus >= 400)
      ).length
    return logs.filter((log) => log.provider === filterType).length
  }

  const handleClearLogs = () => {
    dispatch(clearLogs())
    toast.success("Logs cleared")
  }

  const handleCopyLog = (log: ApiLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2))
    toast.success("Log copied to clipboard")
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 h-[40vh] flex flex-col z-50 shadow-2xl rounded-t-lg border-t border-border">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-slate-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-foreground" />
          <CardTitle className="text-md font-semibold">API Debug Panel</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleClearLogs} aria-label="Clear logs">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => dispatch(toggleDebugPanel())} aria-label="Close panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="p-3 border-b">
        <div className="flex gap-2 flex-wrap">
          {(["all", "google", "microsoft", "errors"] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "secondary" : "outline"}
              size="sm"
              onClick={() => dispatch(setFilter(filterType))}
              className={cn(
                "text-xs px-2.5 py-1 h-auto capitalize",
                filter === filterType && "bg-primary/10 text-primary border-primary/50"
              )}
            >
              {filterType} ({getLogCount(filterType)})
            </Button>
          ))}
        </div>
      </div>
      
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full p-3">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No API requests logged{filter !== "all" ? " for this filter" : ""}.
            </div>
          ) : (
            <div className="space-y-2 text-xs font-mono">
              {logs.map((log) => {
                const isError = log.error || (log.responseStatus && log.responseStatus >= 400)
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "p-2 rounded-sm border cursor-pointer hover:bg-accent/50",
                      isError ? "border-destructive/50 bg-destructive/5" : "border-border bg-slate-50/50"
                    )}
                    onClick={() => handleCopyLog(log)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn("font-semibold", isError ? "text-destructive" : "text-primary")}> 
                        {log.method} {log.url}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex gap-x-3 items-center text-muted-foreground text-[11px]">
                      <span>
                        Provider: <span className="text-foreground/80 capitalize">{log.provider || "unknown"}</span>
                      </span>
                      {log.responseStatus && (
                        <span className={cn(log.responseStatus >= 400 ? "text-destructive" : "text-success")}>
                          Status: {log.responseStatus}
                        </span>
                      )}
                      {log.duration && (
                        <span>
                          Duration: <span className="text-foreground/80">{log.duration}ms</span>
                        </span>
                      )}
                    </div>
                    {log.error && (
                      <div className="mt-1 text-destructive text-[11px]">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
