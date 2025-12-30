import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [...configDefaults.exclude],
    include: [
      '__tests__/**/*.test.ts',
      '__tests__/**/*.property.test.ts',
      'src/**/*.test.ts'
    ],
    reporters: ['default'],
    passWithNoTests: true,
    testTimeout: 30000, // 30 seconds for property-based tests with complex serialization
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', '**/*.test.ts'],
    },
  },
});
