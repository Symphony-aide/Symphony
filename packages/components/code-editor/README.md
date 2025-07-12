# @symphony/code-editor

Symphony editor input component package.

## Overview

This package provides a styled input component for the Symphony application. It's built using Chakra UI V3 and follows Symphony's design system.

## Features

- Single-line and multi-line text inputs
- Symphony brand theming using the shared theme package
- Fully typed with TypeScript
- Accessible form components

## Installation

```bash
# Using pnpm
pnpm install @symphony/code-editor
```

## Usage

```tsx
import { EditorInput } from "@symphony/code-editor";

// Single-line input
const SingleLineExample = () => (
  <EditorInput
    label="Title"
    placeholder="Enter title..."
    onChange={(value) => console.log(value)}
  />
);

// Multi-line text area
const MultiLineExample = () => (
  <EditorInput
    label="Description"
    placeholder="Enter description..."
    multiline
    onChange={(value) => console.log(value)}
  />
);
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | (required) | Label text for the input field |
| `initialValue` | string | `""` | Initial value of the input |
| `multiline` | boolean | `false` | Whether to use a textarea instead of input |
| `onChange` | function | `undefined` | Callback when value changes |
| `placeholder` | string | `"Enter text..."` | Placeholder text |

## Development

To develop this package:

1. Install dependencies: `pnpm install`
2. Build: `pnpm run build`
3. Watch mode for development: `pnpm run dev`

## Dependencies

- @symphony/shared
- @chakra-ui/react 