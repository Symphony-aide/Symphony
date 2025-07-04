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
