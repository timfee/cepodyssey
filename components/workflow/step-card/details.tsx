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
      <h4 className="mb-1 text-sm font-medium text-foreground/90">{title}</h4>
      {children}
    </div>
  );
}
