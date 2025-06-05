import { APIError } from '@/lib/api/utils'
import { isAPIEnablementError, createEnablementError } from '@/lib/api/api-enablement-error'

describe('api-enablement-error', () => {
  it('detects and enhances enablement error', () => {
    const err = new APIError('Admin SDK API has not been used in project 123 before or it is disabled', 403)
    expect(isAPIEnablementError(err)).toBe(true)
    const enhanced = createEnablementError(err)
    expect(enhanced.message).toContain('Google Admin SDK API')
  })
})
