import { SessionManager } from '@/lib/auth/session-manager'
import { auth, cleanupInvalidSession } from '@/app/(auth)/auth'
import { APIError } from '@/lib/api/utils'

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
  cleanupInvalidSession: jest.fn(),
}))

describe('SessionManager', () => {
  it('validates missing session', async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await SessionManager.validate()
    expect(res.valid).toBe(false)
  })

  it('requireBothProviders throws on invalid', async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    await expect(SessionManager.requireBothProviders()).rejects.toBeInstanceOf(APIError)
  })

  it('refreshIfNeeded calls cleanup when expired', async () => {
    ;(auth as jest.Mock).mockResolvedValue({ error: 'RefreshTokenError' })
    const result = await SessionManager.refreshIfNeeded()
    expect(result).toBe(false)
    expect(cleanupInvalidSession).toHaveBeenCalled()
  })
})
