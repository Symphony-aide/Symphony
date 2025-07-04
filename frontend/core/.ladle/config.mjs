import { defineConfig } from "@ladle/react";

export default defineConfig({
  stories: "../src/**/*.stories.{js,jsx,ts,tsx}",
  addons: {
    a11y: {
      enabled: true,
    },
    "@ladle/addon-dark-mode": {
      enabled: true,
    },
    source: {
      enabled: true,
    },
    control: {
      enabled: true,
    },
    "@ladle/addon-width": {
      enabled: true,
      options: {
        widths: [320, 768, 1024],
      },
    },
  },
});