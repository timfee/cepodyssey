import { cn } from "@/lib/utils";
import * as React from "react";

interface CollapsibleContextValue {
  open: boolean;
  setOpen?: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({
  open: false,
});

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function Collapsible({
  open,
  onOpenChange,
  className,
  ...props
}: CollapsibleProps) {
  return (
    <CollapsibleContext.Provider value={{ open, setOpen: onOpenChange }}>
      <div className={cn(className)} {...props} />
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(CollapsibleContext);
  return (
    <button
      className={cn(className)}
      onClick={() => ctx.setOpen?.(!ctx.open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function CollapsibleContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx.open) return null;
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
