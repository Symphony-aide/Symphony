import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import sharedConfigs from '../config/vitest.shared.config.js';

export default defineConfig({
  ...sharedConfigs,
  plugins: [react()],
  test: {
    ...sharedConfigs.test,
    environment: 'jsdom',
  },
});
