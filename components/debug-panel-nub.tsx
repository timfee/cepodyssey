"use client"

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux"
import { toggleDebugPanel, selectFilteredLogs } from "@/lib/redux/slices/debug-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronUp, BugIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function DebugPanelNub() {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.debugPanel.isOpen)
  const logs = useAppSelector(selectFilteredLogs)

  const debugDisabled = !process.env.NEXT_PUBLIC_ENABLE_API_DEBUG

  if (debugDisabled) {
    return null
  }

  const errorCount = logs.filter(
    (log) => log.error || (log.responseStatus && log.responseStatus >= 400)
  ).length

  const pendingCount = logs.filter(
    (log) => !log.responseStatus && !log.error
  ).length

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300",
              isOpen && "pointer-events-none opacity-0"
            )}
          >
            <Button
              onClick={() => dispatch(toggleDebugPanel())}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-t-md rounded-b-none border-b-0 px-6 py-1 h-7",
                "bg-background/95 backdrop-blur-sm shadow-lg",
                "hover:bg-accent hover:shadow-xl",
                "transition-all duration-200",
                errorCount > 0 && "border-destructive/50 animate-pulse"
              )}
            >
              <div className="flex items-center gap-2">
                <BugIcon className="h-3 w-3" />
                <span className="text-xs font-medium">API Debug</span>
                {(errorCount > 0 || pendingCount > 0 || logs.length > 0) && (
                  <div className="flex items-center gap-1">
                    {errorCount > 0 && (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                        {errorCount}
                      </Badge>
                    )}
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        {pendingCount}
                      </Badge>
                    )}
                    {errorCount === 0 && pendingCount === 0 && logs.length > 0 && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {logs.length}
                      </Badge>
                    )}
                  </div>
                )}
                <ChevronUp className="h-3 w-3 ml-1" />
              </div>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-2 max-w-xs">
          <div className="text-xs space-y-1">
            <div>Total Requests: {logs.length}</div>
            {errorCount > 0 && <div className="text-destructive">Errors: {errorCount}</div>}
            {pendingCount > 0 && <div className="text-blue-500">Pending: {pendingCount}</div>}
            <div className="text-muted-foreground mt-1">Click to open debug panel</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

