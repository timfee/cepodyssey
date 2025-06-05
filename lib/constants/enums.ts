export const StepStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked'
} as const;
export type StepStatusType = typeof StepStatus[keyof typeof StepStatus];

export const Provider = {
  GOOGLE: 'google',
  MICROSOFT: 'microsoft'
} as const;
export type ProviderType = typeof Provider[keyof typeof Provider];

export const Automatability = {
  AUTOMATED: 'automated',
  SUPERVISED: 'supervised',
  MANUAL: 'manual'
} as const;
export type AutomatabilityType = typeof Automatability[keyof typeof Automatability];
