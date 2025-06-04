import { checkAutomationOu } from '@/lib/steps/google/create-automation-ou/check'
import { executeCreateAutomationOu } from '@/lib/steps/google/create-automation-ou/execute'
import * as googleApi from '@/lib/api/google'
import { getGoogleToken } from '@/lib/steps/google/utils/auth'
import { OUTPUT_KEYS } from '@/lib/types'
import { mockGoogleOrgUnit } from '@/test-fixtures/fixtures/google-responses'

jest.mock('@/lib/api/google')
jest.mock('@/lib/steps/google/utils/auth')

describe('Create Automation OU Step', () => {
  const mockToken = 'mock-google-token'
  const mockContext = {
    domain: 'example.com',
    tenantId: 'mock-tenant-id',
    outputs: {},
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getGoogleToken as jest.Mock).mockResolvedValue(mockToken)
  })

  describe('checkAutomationOu', () => {
    it('should return completed when OU exists', async () => {
      ;(googleApi.getOrgUnit as jest.Mock).mockResolvedValue(mockGoogleOrgUnit)

      const result = await checkAutomationOu(mockContext)

      expect(result).toEqual({
        completed: true,
        message: "Organizational Unit '/Automation' found.",
        outputs: {
          [OUTPUT_KEYS.AUTOMATION_OU_ID]: mockGoogleOrgUnit.orgUnitId,
          [OUTPUT_KEYS.AUTOMATION_OU_PATH]: mockGoogleOrgUnit.orgUnitPath,
          resourceUrl: expect.stringContaining('admin.google.com'),
        },
      })
      expect(googleApi.getOrgUnit).toHaveBeenCalledWith(mockToken, '/Automation')
    })

    it('should return not completed when OU does not exist', async () => {
      ;(googleApi.getOrgUnit as jest.Mock).mockResolvedValue(null)

      const result = await checkAutomationOu(mockContext)

      expect(result).toEqual({
        completed: false,
        message: "Organizational Unit '/Automation' not found.",
      })
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error')
      ;(googleApi.getOrgUnit as jest.Mock).mockRejectedValue(apiError)

      const result = await checkAutomationOu(mockContext)

      expect(result.completed).toBe(false)
      expect(result.message).toContain('API Error')
    })
  })

  describe('executeCreateAutomationOu', () => {
    it('should create OU successfully', async () => {
      ;(googleApi.createOrgUnit as jest.Mock).mockResolvedValue(mockGoogleOrgUnit)

      const result = await executeCreateAutomationOu(mockContext)

      expect(result).toEqual({
        success: true,
        message: "Organizational Unit 'Automation' created successfully.",
        outputs: {
          [OUTPUT_KEYS.AUTOMATION_OU_ID]: mockGoogleOrgUnit.orgUnitId,
          [OUTPUT_KEYS.AUTOMATION_OU_PATH]: mockGoogleOrgUnit.orgUnitPath,
        },
        resourceUrl: expect.stringContaining('admin.google.com'),
      })
    })
  })
})
