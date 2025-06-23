import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => ({
  resolve: {
    alias: {
      events: "rollup-plugin-node-polyfills/polyfills/events",
      path: "rollup-plugin-node-polyfills/polyfills/path",
    },
  },
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
    tailwindcss(),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
    tsconfigPaths()
  ],
  test: {
    global: true,
    environment: "happy-dom",
    deps: {
      inline: ["recoil"],
    },
  },
}));
