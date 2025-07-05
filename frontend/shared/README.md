# @symphony/shared

Symphony shared theme and UI utilities package.

## Overview

This package provides shared theming and UI utilities for the Symphony application. It includes:

- A customized Chakra UI V3 theme with Symphony's brand colors
- Semantic color tokens for consistent UI design
- Theme provider for React applications

## Installation

```bash
# Using pnpm
pnpm install @symphony/shared
```

## Usage

### Theme Provider

Wrap your application with the ThemeProvider:

```tsx
import { system, ThemeProvider } from "@symphony/shared";
import { App } from "./App";

const Root = () => (
  <ThemeProvider value={system}>
    <App />
  </ThemeProvider>
);
```

### Using Colors

#### Semantic Colors

Semantic colors provide consistent theming and automatically adapt to light/dark mode:

```tsx
<Box bg="primary.solid" color="primary.contrast">
  This uses the primary solid color with appropriate contrast text
</Box>

<Box bg="secondary.muted" color="secondary.fg">
  This uses the muted secondary color with appropriate foreground text
</Box>
```

#### Color Palette

Use the `colorPalette` prop to apply a consistent color scheme:

```tsx
<Button colorPalette="primary" variant="solid">
  Primary Button
</Button>

<Button colorPalette="secondary" variant="outline">
  Secondary Button
</Button>
```
