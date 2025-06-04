import { useRouter } from "next/navigation";
import { useAppDispatch } from "./use-redux";
import { dismissError, ErrorActionType, type ErrorAction } from "@/lib/redux/slices/errors";
import {
  LogInIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LogInIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  XIcon,
};

export function useErrorActions() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const resolveAction = (action: ErrorAction): {
    label: string;
    variant?: "default" | "outline" | "destructive";
    icon?: React.ReactNode;
    onClick: () => void;
  } => {
    const Icon = action.icon ? iconMap[action.icon] : undefined;

    return {
      label: action.label,
      variant: action.variant,
      icon: Icon ? <Icon className="mr-2 h-4 w-4" /> : undefined,
      onClick: () => {
        switch (action.type) {
          case ErrorActionType.SIGN_IN:
            dispatch(dismissError());
            router.push("/login");
            break;
          case ErrorActionType.OPEN_URL:
          case ErrorActionType.ENABLE_API:
            if (action.payload?.url) {
              window.open(action.payload.url as string, "_blank");
            }
            dispatch(dismissError());
            break;
          case ErrorActionType.RETRY_STEP:
            dispatch(dismissError());
            break;
          case ErrorActionType.DISMISS:
          default:
            dispatch(dismissError());
            break;
        }
      },
    };
  };

  return { resolveAction };
}
