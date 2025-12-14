import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@symphony/ui': path.resolve(__dirname, '../ui/components/index.ts'),
      '@symphony/shared': path.resolve(__dirname, '../shared/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
    include: ['__tests__/**/*.test.{js,jsx}', '__tests__/**/*.property.test.{js,jsx}', '__tests__/**/*.perf.test.{js,jsx}', '__tests__/**/*.contract.test.{js,jsx}', '__tests__/**/*.snapshot.test.{js,jsx}', 'src/**/*.test.{js,jsx}'],
    reporters: ['default'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/index.js', '**/*.test.{js,jsx}'],
    },
  },
});
