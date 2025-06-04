# Redux Architecture Guidelines

## Store Organization

The Redux store is organized into three slices:

### 1. App Config Slice (`app-config.ts`)

Manages core configuration and step outputs:

- `domain`: Primary Google Workspace domain
- `tenantId`: Microsoft Entra ID tenant
- `outputs`: Key-value store of step execution results

### 2. Setup Steps Slice (`setup-steps.ts`)

Tracks automation progress:

- Step statuses (pending, in_progress, completed, failed)
- Error messages and metadata
- Completion timestamps

### 3. Modals Slice (`modals.ts`)

Controls all modal dialogs:

- Modal visibility states
- Modal-specific data
- No callbacks or functions (use actions instead)

## State Shape

```typescript
interface RootState {
  appConfig: AppConfigState;
  setupSteps: {
    steps: Record<string, StepStatusInfo>;
  };
  modals: {
    stepDetails: StepDetailsModalState;
  };
}
```

## Modal Management Patterns

### Opening Modals

```typescript
// Modal with data
dispatch(
  openStepDetailsModal({
    step: currentStep,
    outputs: currentOutputs,
  }),
);
```

### Closing Modals

```typescript
// Close specific modal
dispatch(closeStepDetailsModal());

// Close all modals (useful for cleanup)
dispatch(closeAllModals());
```

### Modal Components

Modal components are completely self-contained:

```typescript
export function SomeModal() {
  const modalState = useAppSelector(selectSomeModal);
  const dispatch = useAppDispatch();

  if (!modalState.isOpen) return null;

  return (
    <Dialog open={modalState.isOpen} onOpenChange={() => dispatch(closeSomeModal())}>
      {/* Modal content using modalState data */}
    </Dialog>
  );
}
```

### Available Modals

1. **Step Details Modal**: Shows detailed information about a step

Note: The legacy Google Token modal has been removed as modern provisioning uses OAuth consent flow through the Azure Portal (step M-3).

## Persistence Strategy

### What Gets Persisted

- ✅ App configuration (domain, tenantId)
- ✅ Step outputs (API results)
- ✅ Step statuses and metadata
- ❌ Modal states (ephemeral)
- ❌ Transient UI states

### Persistence Key Structure

```typescript
const storageKey = `automation-progress-${domain}`;
```

This allows multiple domain configurations to coexist.

## Redux Toolkit Benefits

1. **Immer Integration**: Write "mutating" logic that's actually immutable
2. **Built-in DevTools**: Time-travel debugging and state inspection
3. **Type Safety**: Full TypeScript support with inference
4. **Simplified Patterns**: Less boilerplate than traditional Redux

## Anti-Patterns to Avoid

- ❌ Storing functions or callbacks in state
- ❌ Duplicating data across slices
- ❌ Putting async logic in reducers
- ❌ Storing derived state (use selectors)
- ❌ Direct state mutation outside Immer
