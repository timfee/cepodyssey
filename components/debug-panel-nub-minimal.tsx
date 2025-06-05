"use client"

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux"
import { toggleDebugPanel, selectFilteredLogs } from "@/lib/redux/slices/debug-panel"
import { cn } from "@/lib/utils"
import { BugIcon } from "lucide-react"

export function DebugPanelNubMinimal() {
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

  return (
    <button
      onClick={() => dispatch(toggleDebugPanel())}
      className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2 z-[60]",
        "bg-primary text-primary-foreground",
        "px-4 py-1 rounded-t-md",
        "hover:bg-primary/90 transition-all duration-200",
        "flex items-center gap-2",
        "shadow-lg hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isOpen && "opacity-0 pointer-events-none",
        errorCount > 0 && "bg-destructive hover:bg-destructive/90 animate-pulse"
      )}
    >
      <BugIcon className="h-3 w-3" />
      <span className="text-xs font-medium">
        {errorCount > 0 ? `${errorCount} errors` : `${logs.length} logs`}
      </span>
    </button>
  )
}

