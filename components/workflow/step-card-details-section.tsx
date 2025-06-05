import type React from "react";

interface StepCardDetailsSectionProps {
  title: string;
  children: React.ReactNode;
  hasData?: boolean;
}

export function StepCardDetailsSection({
  title,
  children,
  hasData = true,
}: StepCardDetailsSectionProps) {
  if (!hasData) {
    return null;
  }
  return (
    <div>
      <h4 className="font-medium text-sm mb-1.5 text-foreground/90">{title}</h4>
      {children}
    </div>
  );
}
