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
  StepAutomatability,
  StepCompletionType,
  StepStatus,
} from "./workflow-types";

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

export const stateConfigMap: Record<string, StatusDisplayConfig> = {
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
    tooltip: "This step has not been started yet.",
  },
  in_progress: {
    icon: Loader2,
    colorClass: "text-blue-500",
    label: "Checking...",
    tooltip: "Verifying current status with the server.",
  },
  failed: {
    icon: AlertTriangle,
    colorClass: "text-destructive",
    label: "Failed",
    tooltip: "This step encountered an error.",
  },
  available: {
    icon: Info,
    colorClass: "text-primary",
    label: "Available",
    tooltip: "This step is ready to be actioned.",
  },
  blocked: {
    icon: Lock,
    colorClass: "text-muted-foreground",
    label: "Blocked",
    tooltip: "Prerequisites must be completed first.",
  },
};

export const automatabilityConfigMap: Record<
  StepAutomatability,
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
  status: StepStatus,
  completionType?: StepCompletionType,
): StatusDisplayConfig {
  if (status === "completed") {
    return completionType === "user-marked"
      ? stateConfigMap["completed-user"]
      : stateConfigMap["completed-verified"];
  }
  return stateConfigMap[status] || stateConfigMap.pending;
}

export function getAutomatabilityDisplayConfig(
  automatability?: StepAutomatability,
): AutomatabilityDisplayConfig {
  return automatabilityConfigMap[automatability || "manual"];
}
