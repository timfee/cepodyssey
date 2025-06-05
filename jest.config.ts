import nextJest from 'next/jest'
import type { Config } from 'jest'

const createJestConfig = nextJest({ dir: './' })

const customJestConfig: Config = {
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@t3-oss/env-nextjs$': '<rootDir>/test/mocks/t3-env.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transformIgnorePatterns: [
    '/node_modules/(?!.*(@t3-oss/env-nextjs|@t3-oss/env-core))',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
}

export default createJestConfig(customJestConfig)
