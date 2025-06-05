import type { ManagedStep } from '@/lib/types'

export const mockStep: ManagedStep = {
  id: 'G-1',
  title: 'Create Automation OU',
  description: 'Create an organizational unit for automation users',
  details: 'This creates an OU under the root for automation accounts.',
  category: 'Google',
  activity: 'Foundation',
  provider: 'Google',
  automatability: 'automated',
  automatable: true,
  status: 'pending',
}
