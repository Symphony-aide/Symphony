import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { colors } from "./colors";

/**
 * Create the custom theme configuration using Chakra UI V3
 */
const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        primary: {
          50: { value: colors.primary[900] },
          100: { value: colors.primary[800] },
          200: { value: colors.primary[700] },
          300: { value: colors.primary[600] },
          400: { value: colors.primary[500] }, 
          500: { value: colors.primary[400] },
          600: { value: colors.primary[300] },
          700: { value: colors.primary[200] },
          800: { value: colors.primary[100] },
          900: { value: '#070310' }, // Darker than 100
        },
        secondary: {
          50: { value: colors.secondary[900] },
          100: { value: colors.secondary[800] },
          200: { value: colors.secondary[700] },
          300: { value: colors.secondary[600] },
          400: { value: colors.secondary[500] },
          500: { value: colors.secondary[400] },
          600: { value: colors.secondary[300] },
          700: { value: colors.secondary[200] },
          800: { value: colors.secondary[100] },
          900: { value: '#010005' }, // Darker than 100
        },
      },
    },
    semanticTokens: {
      colors: {
        // Primary semantic tokens
        primary: {
          solid: { value: "{colors.primary.400}" },
          contrast: { value: "{colors.primary.50}" },
          fg: { value: "{colors.primary.700}" },
          muted: { value: "{colors.primary.200}" },
          subtle: { value: "{colors.primary.100}" },
          emphasized: { value: "{colors.primary.300}" },
          focusRing: { value: "{colors.primary.500}" },
        },
        // Secondary semantic tokens
        secondary: {
          solid: { value: "{colors.secondary.400}" },
          contrast: { value: "{colors.secondary.50}" },
          fg: { value: "{colors.secondary.700}" },
          muted: { value: "{colors.secondary.200}" },
          subtle: { value: "{colors.secondary.100}" },
          emphasized: { value: "{colors.secondary.300}" },
          focusRing: { value: "{colors.secondary.500}" },
        },
      },
    },
  },
});

// Create the styling system with our custom configuration
export const system = createSystem(defaultConfig, customConfig);

// Export type helper for the theme
export type SymphonyTheme = typeof system;

// Export a React provider for the theme
export { ChakraProvider as ThemeProvider } from "@chakra-ui/react"; 