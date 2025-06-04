# Custom Hooks Guidelines

## Hook Organization

Custom hooks encapsulate reusable stateful logic following React 18 patterns.

```
hooks/
├── use-redux.ts      # Typed Redux integration
└── use-auto-check.ts # Automated step verification
```

## Redux Integration Hook (`use-redux.ts`)

```typescript
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { TypedUseSelectorHook } from "react-redux";
import { useDispatch, useSelector } from "react-redux";

// Typed versions of standard Redux hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Usage in Components

```typescript
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";

// In component
const appConfig = useAppSelector((state) => state.appConfig);
const dispatch = useAppDispatch();

// Dispatch actions with full type safety
dispatch(addOutputs({ [OUTPUT_KEYS.AUTOMATION_OU_ID]: ouId }));
```

## Auto-Check Hook Pattern (`use-auto-check.ts`)

```typescript
import { useEffect, useRef } from "react";
import { useAppSelector } from "./use-redux";

export function useAutoCheck(executeCheck: (stepId: string) => Promise<void>) {
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!appConfig.domain || !appConfig.tenantId || hasChecked.current) return;

    hasChecked.current = true;

    // Only safe, read-only checks
    const autoCheckSteps = ["G-1", "G-2", "G-3", "G-4", "G-5", "M-1", "M-6"];

    const checkPromises = autoCheckSteps
      .filter((stepId) => {
        const status = stepsStatus[stepId];
        return (
          !status || status.status === "pending" || status.status === "failed"
        );
      })
      .map((id) => executeCheck(id));

    Promise.all(checkPromises).catch(console.error);
  }, [appConfig.domain, appConfig.tenantId, stepsStatus, executeCheck]);
}
```

## React 18 Hook Patterns

### useTransition for Async Actions

```typescript
import { useTransition, useCallback } from "react";

export function useStepExecution(onExecute: (id: string) => Promise<void>) {
  const [isPending, startTransition] = useTransition();

  const executeStep = useCallback(
    (stepId: string) => {
      startTransition(async () => {
        try {
          await onExecute(stepId);
        } catch (error) {
          console.error(`Step ${stepId} failed:`, error);
        }
      });
    },
    [onExecute],
  );

  return { executeStep, isPending };
}
```

### useDeferredValue for Performance

```typescript
import { useDeferredValue, useMemo } from "react";

export function useFilteredSteps(steps: ManagedStep[], searchTerm: string) {
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredSteps = useMemo(() => {
    return steps.filter((step) =>
      step.title.toLowerCase().includes(deferredSearchTerm.toLowerCase()),
    );
  }, [steps, deferredSearchTerm]);

  return filteredSteps;
}
```

## Hook Standards

### Dependency Arrays

```typescript
// Always include all dependencies
useEffect(() => {
  // Effect logic
}, [dependency1, dependency2]);

// Use useCallback for stable references
const handleAction = useCallback(
  async (id: string) => {
    await executeAction(id);
  },
  [executeAction],
);

// Use useMemo for expensive computations
const computedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

### Error Handling in Hooks

```typescript
useEffect(() => {
  const performAsyncOperation = async () => {
    try {
      await operation();
    } catch (error) {
      console.error("Operation failed:", error);
      // Don't throw - let component continue
    }
  };

  performAsyncOperation();
}, [dependencies]);
```

### Cleanup Patterns

```typescript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      // Handle response
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fetch failed:", error);
      }
    }
  };

  fetchData();

  return () => {
    controller.abort();
  };
}, [url]);
```

## Custom Hook Creation Guidelines

### When to Create a Hook

- ✅ Reusable stateful logic across multiple components
- ✅ Complex side effects that need cleanup
- ✅ Integration with external systems (Redux, APIs)
- ✅ Encapsulating React 18 features (transitions, deferred values)
- ❌ Simple calculations (use regular functions)
- ❌ One-off component-specific logic

### Hook Naming Conventions

- Always start with `use` (React requirement)
- Descriptive names: `useAutoCheck`, `useStepExecution`
- Avoid generic names: `useData`, `useLogic`
- Follow existing patterns in the codebase

### Performance Considerations

- Use `useRef` for values that don't trigger re-renders
- Implement proper cleanup in `useEffect`
- Avoid creating new objects/functions in render cycles
- Use React 18 concurrent features appropriately

## Testing Custom Hooks

- Test hooks in isolation using @testing-library/react-hooks
- Mock external dependencies (Redux store, API calls)
- Test both success and error scenarios
- Verify cleanup functions are called properly
