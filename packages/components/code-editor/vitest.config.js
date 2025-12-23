import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'ui': path.resolve(__dirname, '../../ui/components/index.ts'),
      '@symphony/shared': path.resolve(__dirname, '../../shared/index.ts'),
      '@symphony/commands': path.resolve(__dirname, '../commands/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
    include: ['**/__tests__/**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**/*.property.test.{js,jsx,ts,tsx}'],
    reporters: ['default'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/index.js', '**/*.test.{js,jsx,ts,tsx}'],
    },
  },
});
