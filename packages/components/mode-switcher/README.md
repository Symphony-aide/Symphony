# Mode Switcher Component

Toggle between Normal and Maestro modes in Symphony IDE.

## Features

- Two modes: Normal (🎼) and Maestro (🎩)
- Smooth transitions with Symphony primary color
- Keyboard accessible
- Controlled component with callback

## Usage

```jsx
import { ModeSwitcher } from '@symphony/mode-switcher';

function App() {
  const [mode, setMode] = useState('normal');

  return (
    <ModeSwitcher
      mode={mode}
      onModeChange={setMode}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'normal' \| 'maestro'` | `'normal'` | Current active mode |
| `onModeChange` | `function` | - | Callback when mode changes |
| `className` | `string` | `''` | Additional CSS classes |

## Modes

### Normal Mode (🎼)
- Traditional development workflow
- Manual control over tools and processes

### Maestro Mode (🎩)
- AI-orchestrated development
- Intelligent automation and suggestions
