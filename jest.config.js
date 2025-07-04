module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@components/(.*)$': '<rootDir>/src/components/$1',
      '^@utils/(.*)$': '<rootDir>/src/utils/$1',
      '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
      '^@theme/(.*)$': '<rootDir>/src/theme/$1',
      '^@types/(.*)$': '<rootDir>/src/types/$1',
    },
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
      '^.+\\.(js|jsx)$': 'babel-jest',
    },
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{ts,tsx}',
      '!src/**/*.story.{ts,tsx}',
      '!src/main.tsx',
      '!src/vite-env.d.ts',
      '!src/setupTests.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
      '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transformIgnorePatterns: [
      'node_modules/(?!(.*\\.mjs$|@chakra-ui|framer-motion))',
    ],
  };