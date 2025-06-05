"use client"

import { useState } from "react"
import { Card, CardFooter } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Network,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApiLogEntry } from "@/lib/redux/slices/debug-panel"

interface ApiLogCardProps {
  log: ApiLogEntry
  onCopyLog: (log: ApiLogEntry) => void
}

const statusConfig: Record<string, { icon: LucideIcon; colorClass: string; label: string }> = {
  success: {
    icon: CheckCircle2,
    colorClass: "text-green-600",
    label: "Success",
  },
  error: {
    icon: XCircle,
    colorClass: "text-destructive",
    label: "Error",
  },
  pending: {
    icon: Loader2,
    colorClass: "text-blue-500",
    label: "Pending",
  },
}

const getProviderColorClass = (provider?: string): string => {
  switch (provider) {
    case "google":
      return "text-blue-600 font-medium"
    case "microsoft":
      return "text-teal-600 font-medium"
    default:
      return "text-muted-foreground/90 font-medium"
  }
}

export function ApiLogCard({ log, onCopyLog }: ApiLogCardProps) {
  const status = log.error ? "error" : log.responseStatus ? "success" : "pending"
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon

  const isError = status === "error" || (log.responseStatus && log.responseStatus >= 400)
  const [isExpanded, setIsExpanded] = useState(isError)

  const renderJson = (data: unknown, title: string) => {
    if (!data) return null
    return (
      <div>
        <h4 className="font-medium text-sm mb-1 text-foreground/90">{title}</h4>
        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Card
        className={cn(
          "w-full transition-all duration-200 ease-in-out",
          "shadow-google-card border",
          isError ? "border-destructive/50" : "hover:shadow-google-card-hover hover:border-primary/50"
        )}
      >
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={isExpanded ? `log-${log.id}` : ""}
          onValueChange={(value) => setIsExpanded(!!value)}
        >
          <AccordionItem value={`log-${log.id}`} className="border-b-0">
            <AccordionTrigger
              className={cn(
                "p-4 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-[state=open]:pb-2 group rounded-t-md",
                !isError && "hover:bg-primary/5"
              )}
            >
              <div className="flex flex-col w-full text-left">
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <StatusIcon
                          className={cn("h-5 w-5 shrink-0", statusInfo.colorClass, status === "pending" && "animate-spin")}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{statusInfo.label}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.method}
                      </Badge>
                      {log.responseStatus && (
                        <span className={cn(
                          "text-sm font-mono",
                          log.responseStatus >= 200 && log.responseStatus < 300 && "text-green-600",
                          log.responseStatus >= 300 && log.responseStatus < 400 && "text-blue-600",
                          log.responseStatus >= 400 && log.responseStatus < 500 && "text-orange-600",
                          log.responseStatus >= 500 && "text-red-600"
                        )}>
                          {log.responseStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs ml-2 shrink-0 pt-1 flex items-center gap-2">
                    <span className={getProviderColorClass(log.provider)}>
                      {log.provider === "google" ? "Google" : log.provider === "microsoft" ? "Microsoft" : "API"}
                    </span>
                    {log.duration && (
                      <>
                        <span className="text-muted-foreground/80">•</span>
                        <span className="text-muted-foreground/80 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.duration}ms
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs pl-8">
                  <span className="text-muted-foreground truncate max-w-[600px] group-data-[state=closed]:max-w-[400px]">
                    {log.url}
                  </span>
                </div>

                {log.error && (
                  <div className="flex items-center gap-2 mt-2 pl-8">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="text-sm text-destructive truncate">
                      {log.error}
                    </span>
                  </div>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-4 bg-card">
              <div className="pl-8 space-y-4 pt-2">
                {renderJson(log.headers, "Request Headers")}
                {renderJson(log.requestBody, "Request Body")}
                {renderJson(log.responseBody, "Response Body")}
                {log.error && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-destructive">Error Details</h4>
                    <p className="text-sm text-destructive/90 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      {log.error}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <CardFooter className={cn("p-3 border-t flex gap-2 items-center", isError && "bg-red-50 dark:bg-red-950/10")}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onCopyLog(log)}
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          {log.url.startsWith('http') && (
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <a href={log.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </a>
            </Button>
          )}
          <div className="flex-1" />
          <Badge 
            variant={isError ? "destructive" : "secondary"} 
            className="text-xs"
          >
            {statusInfo.label}
          </Badge>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
