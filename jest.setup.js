import '@testing-library/jest-dom'

// Mock environment variables
process.env = {
  ...process.env,
  GOOGLE_API_BASE: 'https://mock.googleapis.com',
  GOOGLE_IDENTITY_BASE: 'https://mock.cloudidentity.googleapis.com',
  GRAPH_API_BASE: 'https://mock.graph.microsoft.com/v1.0',
  GOOGLE_ADMIN_CONSOLE_BASE: 'https://mock.admin.google.com',
  AZURE_PORTAL_BASE: 'https://mock.portal.azure.com',
  NEXT_PUBLIC_LOG_LEVEL: 'error',
  NEXT_PUBLIC_LOG_TO_CONSOLE: 'false',
  NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS: '-1',
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock NextAuth
jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
  },
}))
