# Component Guidelines

## Component Architecture

All components follow React 18 patterns with clear separation of concerns and standardized prop interfaces.

## Component Categories

### shadcn/ui Components (`ui/`)

- Pre-built components following Radix UI patterns
- Styled with Tailwind CSS utility classes
- Use existing variants: `variant="default" | "outline" | "destructive"`
- Import pattern: `import { Button } from "@/components/ui/button"`

### Feature Components

- `dashboard.tsx`: Main orchestration component
- `progress.tsx`: Step visualization and progress tracking
- `step.tsx` & `collapsible-step.tsx`: Individual step rendering
- `auth.tsx`: Authentication status and controls
- `form.tsx`: Configuration display (read-only)
- `google-token-modal.tsx`: Legacy modal for entering a Google provisioning token. With the new OAuth-based M-3 step this component is largely obsolete and may be removed.

## React 18 Patterns

### Client Component Standards

```typescript
"use client";

import { useTransition } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";

// Props interface with clear types
interface ComponentProps {
  step: ManagedStep;
  onExecuteStep: (stepId: string) => void;
  canRunGlobal?: boolean;
  isLastStep?: boolean;
}

export function ComponentName({ step, onExecuteStep, canRunGlobal = false }: ComponentProps) {
  const [isPending, startTransition] = useTransition();

  const handleAction = useCallback((id: string) => {
    startTransition(() => {
      onExecuteStep(id);
    });
  }, [onExecuteStep]);

  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
}
```

### State Management Integration

```typescript
// Use typed Redux hooks
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";

// Access state consistently
const appConfig = useAppSelector((state) => state.appConfig);
const stepsStatus = useAppSelector((state) => state.setupSteps.steps);
const dispatch = useAppDispatch();

// Dispatch actions
dispatch(updateStep({ id: stepId, status: "completed" }));
```

### Event Handling with Transitions

```typescript
import { useTransition } from "react";

const [isPending, startTransition] = useTransition();

const handleAsyncAction = useCallback(
  (id: string) => {
    startTransition(async () => {
      try {
        await executeAction(id);
        toast.success("Action completed");
      } catch (error) {
        toast.error("Action failed: " + error.message);
      }
    });
  },
  [executeAction],
);
```

## shadcn/ui Usage Patterns

### Button Component

```typescript
import { Button } from "@/components/ui/button";

// Standard variants
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="destructive">Delete Action</Button>

// With loading state
<Button disabled={isPending}>
  {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

### Card Component

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Toast Notifications

```typescript
import { toast } from "sonner";

// Success notification
toast.success("Operation completed successfully");

// Error notification
toast.error("Operation failed", {
  description: error.message,
  duration: 10000,
});

// Loading with ID for updates
toast.loading("Processing...", { id: "operation-123" });
toast.success("Completed!", { id: "operation-123" });
```

## Styling Standards

- Use Tailwind CSS utility classes exclusively
- Follow existing spacing scale: `p-4`, `mt-6`, `space-y-4`
- Color scheme: `bg-slate-50`, `text-slate-900`, `border-slate-200`
- Dark mode support: `dark:bg-slate-900`, `dark:text-slate-50`
- Responsive design: `md:grid-cols-2`, `lg:grid-cols-3`

## Accessibility Standards

- Use semantic HTML elements
- Proper ARIA labels: `aria-label`, `aria-describedby`
- Keyboard navigation support
- Screen reader friendly content
- Color contrast compliance (built into shadcn/ui)

## Anti-Patterns

- ❌ Don't fetch data directly in Client Components (use Server Actions)
- ❌ Don't duplicate step execution logic
- ❌ Don't hardcode step IDs or configuration values
- ❌ Don't mix authentication logic with UI components
- ❌ Don't use useEffect for data fetching (use Server Components)
