import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import tsconfigPaths from 'vite-tsconfig-paths'

// noinspection JSUnusedGlobalSymbols
export default defineConfig(() => ({
  build: {
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 8080,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.story.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  // resolve: {
  //   alias: {
  //     '@': resolve(__dirname, './src'),
  //     '@components': resolve(__dirname, './src/components'),
  //     '@utils': resolve(__dirname, './src/utils'),
  //     '@hooks': resolve(__dirname, './src/hooks'),
  //     '@theme': resolve(__dirname, './src/theme'),
  //     '@types': resolve(__dirname, './src/types'),
  //   },
  // },
  clearScreen: false,
  plugins: [
    react(),
    checker({
      typescript: true,
      // Disable ESLint checker due to compatibility issues with ESLint v9
    }),
    tsconfigPaths()
  ],
}));
