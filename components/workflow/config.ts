import {
  AlertTriangle,
  CheckCircle2,
  ClipboardEdit,
  Eye,
  Info,
  Loader2,
  Lock,
  UserCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  StepStatusInfo,
  StepDefinition,
} from "@/lib/types";

export interface StatusDisplayConfig {
  icon: LucideIcon;
  colorClass: string;
  label: string;
  tooltip: string;
}

export interface AutomatabilityDisplayConfig {
  icon: LucideIcon;
  baseColorClass?: string;
  badgeClasses?: string;
  label: string;
  tooltip: string;
}

const stateConfigMap: Record<string, StatusDisplayConfig> = {
  "completed-verified": {
    icon: CheckCircle2,
    colorClass: "text-green-600",
    label: "Completed",
    tooltip: "Completed and verified by the system.",
  },
  "completed-user": {
    icon: UserCheck,
    colorClass: "text-sky-500",
    label: "Marked as Done",
    tooltip: "You've marked this step as completed.",
  },
  pending: {
    icon: Info,
    colorClass: "text-muted-foreground",
    label: "Pending",
    tooltip: "This step is ready or pending prerequisites.",
  },
  in_progress: {
    icon: Loader2,
    colorClass: "text-blue-500",
    label: "Processing...",
    tooltip: "This step is currently being executed or checked.",
  },
  failed: {
    icon: AlertTriangle,
    colorClass: "text-destructive",
    label: "Failed",
    tooltip: "This step encountered an error.",
  },
  blocked: {
    icon: Lock,
    colorClass: "text-muted-foreground",
    label: "Blocked",
    tooltip: "Prerequisite steps must be completed first.",
  },
};

export const automatabilityConfigMap: Record<
  StepDefinition["automatability"],
  AutomatabilityDisplayConfig
> = {
  automated: {
    icon: Zap,
    baseColorClass: "text-primary",
    label: "Automated",
    tooltip: "This step can be fully automated by the system.",
  },
  supervised: {
    icon: Eye,
    badgeClasses:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded-sm",
    baseColorClass: "text-amber-600 dark:text-amber-400",
    label: "Supervised",
    tooltip: "This step requires your review before or during execution.",
  },
  manual: {
    icon: ClipboardEdit,
    baseColorClass: "text-muted-foreground",
    label: "Manual",
    tooltip:
      "This step requires manual action from you, possibly in another system.",
  },
};

export function getStatusDisplayConfig(
  status: StepStatusInfo["status"],
  completionType?: StepStatusInfo["completionType"],
): StatusDisplayConfig {
  if (status === "completed") {
    return completionType === "user-marked"
      ? stateConfigMap["completed-user"]
      : stateConfigMap["completed-verified"];
  }
  return stateConfigMap[status] || stateConfigMap.pending;
}

export function getAutomatabilityDisplayConfig(
  automatability: StepDefinition["automatability"],
): AutomatabilityDisplayConfig {
  return automatabilityConfigMap[automatability || "manual"];
}

export const getProviderColorClass = (provider: string): string => {
  switch (provider?.toLowerCase()) {
    case "google":
      return "text-blue-600 dark:text-blue-400 font-medium";
    case "microsoft":
      return "text-teal-600 dark:text-teal-400 font-medium";
    default:
      return "text-muted-foreground/90 font-medium";
  }
};

export function getMethodColor(method: string): string {
  switch (method?.toUpperCase()) {
    case "GET":
      return "text-blue-600 dark:text-blue-400";
    case "POST":
      return "text-green-600 dark:text-green-400";
    case "PATCH":
      return "text-orange-500 dark:text-orange-400";
    case "PUT":
      return "text-purple-600 dark:text-purple-400";
    case "DELETE":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}
