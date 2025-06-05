"use client"

import { useAppSelector, useAppDispatch } from "@/hooks/use-redux"
import { toggleDebugPanel, selectFilteredLogs } from "@/lib/redux/slices/debug-panel"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BugIcon, ChevronLeft } from "lucide-react"

export function DebugPanelNubSide() {
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
        "fixed right-0 bottom-20 z-[60]",
        "bg-background border border-r-0 rounded-l-md",
        "px-2 py-4 shadow-lg",
        "hover:bg-accent transition-all duration-200",
        "flex flex-col items-center gap-2",
        "writing-mode-vertical-lr",
        isOpen && "opacity-0 pointer-events-none",
        errorCount > 0 && "border-destructive animate-pulse"
      )}
      style={{ writingMode: "vertical-lr" }}
    >
      <ChevronLeft className="h-3 w-3 rotate-90" />
      <span className="text-xs font-medium">API Debug</span>
      {errorCount > 0 && (
        <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px]">
          {errorCount}
        </Badge>
      )}
    </button>
  )
}

