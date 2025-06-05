export const StepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked'
} as const;

export const Provider = {
  GOOGLE: 'google',
  MICROSOFT: 'microsoft'
} as const;

export const Automatability = {
  AUTOMATED: 'automated',
  SUPERVISED: 'supervised',
  MANUAL: 'manual'
} as const;
