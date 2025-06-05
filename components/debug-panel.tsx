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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BugIcon,
  TrashIcon,
  AlertTriangleIcon,
  MinimizeIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ApiLogCard } from "./api-log-card"
import { toast } from "sonner"
import { useEffect } from "react"

export function DebugPanel() {
  const dispatch = useAppDispatch()
  const { isOpen, filter } = useAppSelector(selectDebugPanel)
  const logs = useAppSelector(selectFilteredLogs)

  const debugDisabled = !process.env.NEXT_PUBLIC_ENABLE_API_DEBUG

  const errorCount = logs.filter(
    (log) => log.error || (log.responseStatus && log.responseStatus >= 400)
  ).length

  const handleCopyLog = (log: ApiLogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2))
    toast.success("Log copied to clipboard")
  }

  const handleClearLogs = () => {
    dispatch(clearLogs())
    toast.success("Logs cleared")
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        dispatch(toggleDebugPanel())
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [dispatch])

  if (debugDisabled || !isOpen) {
    return null
  }

  const showProdWarning =
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_API_DEBUG

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[60vh] flex flex-col bg-background border-t shadow-2xl">
      {showProdWarning && (
        <Alert className="rounded-none border-x-0 border-t-0">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Debug mode is enabled in production
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="flex-1 rounded-none border-0">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BugIcon className="h-5 w-5" />
                API Debug Panel
              </CardTitle>
              
              <Tabs
                value={filter}
                onValueChange={(v) =>
                  dispatch(setFilter(v as DebugPanelState["filter"]))
                }
              >
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs">
                    All ({logs.length})
                  </TabsTrigger>
                  <TabsTrigger value="google" className="text-xs">
                    Google
                  </TabsTrigger>
                  <TabsTrigger value="microsoft" className="text-xs">
                    Microsoft
                  </TabsTrigger>
                  <TabsTrigger value="errors" className="text-xs">
                    Errors ({errorCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch(toggleDebugPanel())}
              >
                <MinimizeIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(60vh-8rem)]">
            <div className="p-6 space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No API requests logged yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    API calls will appear here as they are made
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <ApiLogCard
                    key={log.id}
                    log={log}
                    onCopyLog={handleCopyLog}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
