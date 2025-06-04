# Component Guidelines

## Component Architecture

All components follow React 18 patterns with clear separation of concerns and standardized prop interfaces.

## Component Categories

### shadcn/ui Components (`ui/`)

Required components for the enhanced UI:

- Core: `button`, `card`, `badge`, `alert`, `dialog`, `input`, `label`
- Data Display: `table`, `separator`, `collapsible`
- Feedback: `error-dialog` for errors, `toast` (via sonner) for success/info, `tooltip`
- Form: `form` (react-hook-form integration)

### Feature Components

- `dashboard.tsx`: Main orchestration component
- `enhanced-step-card.tsx`: Comprehensive step display with inputs/outputs
- `progress.tsx`: Step list visualization using enhanced cards
- `auth.tsx`: Authentication status and controls
- `form.tsx`: Configuration display (read-only)
- `session-warning.tsx`: Token expiration warnings

## Step Card Pattern

The `StepCard` component follows these principles:

```typescript
interface StepCardProps {
  step: ManagedStep;
  outputs: Record<string, unknown>;
  onExecute: (stepId: string) => void;
  canRunGlobal: boolean;
}
```

### Display Hierarchy

1. **Header**: Status icon, title, description, badges (Manual/Automated, Step ID)
2. **Actions**: Execute/Retry button, Mark Complete (manual steps), Resource links
3. **Collapsible Details**:
   - Required Inputs table with availability status
   - Produced Outputs table with generated values
   - Error details with resolution guidance

### Status Visual Design

```typescript
const statusDisplay = {
  completed: {
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  in_progress: {
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  failed: {
    borderColor: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  pending: {
    borderColor: "border-gray-200 dark:border-gray-800",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
};
```

## URL Handling in Components

Components should never construct URLs directly. Instead:

```typescript
import { portalUrls } from "@/lib/api/url-builder";
import { OUTPUT_KEYS } from "@/lib/types";

// Good: Using centralized URL builder
const profileUrl = portalUrls.google.sso.samlProfile(
  outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string,
);

// Bad: Hardcoding URLs
const profileUrl = `https://admin.google.com/ac/security/sso/${profileId}`;
```

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

### Modal State Management

All modals use Redux for state management:

```typescript
// Import modal actions
import { openStepDetailsModal } from "@/lib/redux/slices/modals";

// Open modal with data
dispatch(
  openStepDetailsModal({
    step: managedStep,
    outputs: currentOutputs,
  }),
);

// Modal components are self-contained
export function StepDetailsModal() {
  const { isOpen, step, outputs } = useAppSelector(selectStepDetailsModal);
  // Component reads everything from Redux
}
```

**Modal Types:**

- `StepDetailsModal`: For viewing step instructions and links
- `StepOutputsDialog`: For viewing inputs/outputs dependencies

**Modal Manager Pattern:**

The `ModalManager` component renders all modals based on Redux state:

```typescript
<Providers>
  {children}
  <ModalManager /> {/* Renders active modals */}
  <Toaster />
</Providers>
```

This ensures:

- Modals are rendered at the root level
- No z-index conflicts
- Consistent modal behavior
- Clean component hierarchy

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
