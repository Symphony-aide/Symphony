# Musical Background Component

Animated SVG background with reciprocal function curves and gradient mesh for Symphony IDE.

## Features

- Mathematical reciprocal function curves (y = k/(x + offset))
- Three animated wave lines with staggered timing
- Gradient mesh background with radial gradients
- Symphony blue color palette
- Smooth wave flow animations
- Fully customizable and toggleable

## Usage

### Basic Usage

```jsx
import { MusicalBackground } from '@symphony/musical-background';

function App() {
  return (
    <div className="relative h-screen">
      <MusicalBackground />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### Without Animation

```jsx
<MusicalBackground animated={false} />
```

### Without Gradient Mesh

```jsx
<MusicalBackground gradientMesh={false} />
```

### Full Control

```jsx
<MusicalBackground 
  animated={true}
  gradientMesh={true}
  className="opacity-50"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animated` | `boolean` | `true` | Enable/disable wave animations |
| `gradientMesh` | `boolean` | `true` | Show/hide gradient mesh background |
| `className` | `string` | `''` | Additional CSS classes |

## Technical Details

### Wave Generation

The component generates three mathematical curves using the reciprocal function:
```
y = (offset + 150 / (x * scale)) + 50
```

Each curve has:
- Different offset values (0, 30, 60)
- Different scale values (1, 1.2, 1.4)
- Different stroke widths (2, 1.8, 1.5)
- Staggered animation delays (0s, 0.8s, 1.6s)

### Animation

The waves use a 4-second ease-in-out opacity animation that cycles between 0.3 and 0.6 opacity, creating a gentle pulsing effect.

### Color Gradients

Three linear gradients using Symphony's color palette:
- **waveGrad1**: Primary blue (#5B8FF9)
- **waveGrad2**: Light blue (#7BA5FA)
- **waveGrad3**: Dark blue (#4A7AD8)

### Gradient Mesh

Four radial gradients positioned at:
- 27% 37% (Primary)
- 97% 21% (Dark)
- 52% 99% (Accent)
- 10% 29% (Light)

## Styling Notes

- Component uses `absolute` positioning with `inset-0`
- Set to `pointer-events-none` so it doesn't interfere with clicks
- Parent container should have `relative` positioning
- Content should have higher z-index to appear above background

## Performance

- SVG paths are generated once on mount
- Uses CSS animations (GPU-accelerated)
- Cleanup on unmount prevents memory leaks
- 300 points per curve for smooth rendering
