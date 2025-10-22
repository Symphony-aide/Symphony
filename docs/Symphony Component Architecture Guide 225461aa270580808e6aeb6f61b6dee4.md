# Symphony Component Architecture Guide

## Overview

This guide details the architecture for Symphony's component system - the foundation for creating specialized UI components that integrate with Symphony's AI orchestration system.

## Package Structure

```
frontend/
  ├── {component}/
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── Component.tsx              # Core component
  │   │   │   ├── ComponentBlock.tsx         # Block-compatible wrapper
  │   │   │   └── ComponentToolbar.tsx       # Component controls
  │   │   ├── hooks/
  │   │   │   ├── useComponent.ts            # Component state and methods
  │   │   │   ├── useComponentExtensions.ts  # Extension management
  │   │   │   └── useComponentTheme.ts       # Theme handling
  │   │   ├── context/
  │   │   │   ├── ComponentContext.tsx       # Component configuration context
  │   │   │   └── ComponentLayoutContext.tsx # Layout management context
  │   │   ├── layout/
  │   │   │   ├── BlockAdapter.tsx           # Integration with block system
  │   │   │   └── LayoutManager.tsx          # Position/resize management
  │   │   ├── themes/
  │   │   │   ├── ThemeProvider.tsx          # Theme context provider
  │   │   │   └── defaultThemes.ts           # Built-in themes
  │   │   └── symphony/
  │   │       ├── SymphonyComponent.tsx      # Symphony-specific wrapper
  │   │       ├── AIModelIntegration.ts      # AI model hooks
  │   │       └── ExtensionPoints.ts         # Symphony extension points
  │   └── package.json
  └── core/
      └── src/
          └── blocks/
              └── ComponentBlock.tsx         # Core integration point

```

## Core Component Architecture

The core component uses a foundation library (Monaco, CodeMirror, etc.) as needed:

```tsx
// Simplified example
export const Component = ({
  initialValue,
  language,
  onChange,
  ...props
}) => {
  const { componentRef, value, setValue } = useComponent(initialValue);
  const { theme } = useComponentTheme();
  const { extensions } = useComponentExtensions(language);

  return (
    <div className="symphony-component">
      {/* Component implementation */}
    </div>
  );
};

```

## Block-Based Integration

Components are designed to work within Symphony's block system:

```tsx
// ComponentBlock.tsx
export const ComponentBlock = (props) => {
  const { blockProps, componentProps } = useBlockAdapter(props);

  return (
    <div {...blockProps} className="symphony-component-block">
      <Component {...componentProps} />
    </div>
  );
};

```

The BlockAdapter handles:

- Resizing events
- Drag and drop capabilities
- Block API compatibility
- Position management

## Configuration and Settings

React Context provides component configuration:

```tsx
// ComponentContext.tsx
interface ComponentConfig {
  fontSize: number;
  lineHeight: number;
  // Other component settings
}

const ComponentContext = createContext<{
  config: ComponentConfig;
  updateConfig: (config: Partial<ComponentConfig>) => void;
}>({
  config: defaultConfig,
  updateConfig: () => {},
});

export const ComponentProvider: React.FC = ({ children }) => {
  const [config, setConfig] = useState<ComponentConfig>(defaultConfig);

  const updateConfig = (newConfig: Partial<ComponentConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <ComponentContext.Provider value={{ config, updateConfig }}>
      {children}
    </ComponentContext.Provider>
  );
};

```

## Layout Management

The layout manager handles block positioning and resizing:

```tsx
// LayoutManager.tsx
export class LayoutManager {
  private blocks: Map<string, BlockInfo> = new Map();

  addBlock(id: string, initialPosition: Position): void {
    // Implementation
  }

  updateBlockPosition(id: string, position: Position): void {
    // Implementation
  }

  getLayout(): Layout {
    return {
      blocks: Array.from(this.blocks.values())
    };
  }
}

```

## Symphony Integration

The Symphony-specific wrapper integrates with AI models:

```tsx
// SymphonyComponent.tsx
export const SymphonyComponent = (props) => {
  const {
    aiSuggestions,
    requestAnalysis,
    isProcessing
  } = useAIModelIntegration();

  const symphonyExtensions = SymphonyExtensionPoints.getActiveExtensions();

  return (
    <div className="symphony-component-container">
      <Component
        {...props}
        extensions={[...props.extensions, ...symphonyExtensions]}
        suggestions={aiSuggestions}
        onRequestAnalysis={requestAnalysis}
        isAIProcessing={isProcessing}
      />
    </div>
  );
};

```

## AI Model Integration

```tsx
// AIModelIntegration.ts
export const useAIModelIntegration = (componentState) => {
  const conductorClient = useConductorClient();
  const [suggestions, setSuggestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestAnalysis = async (data, context) => {
    setIsProcessing(true);
    try {
      const result = await conductorClient.requestAnalysis({
        data,
        context,
        componentType: componentState.type
      });
      setSuggestions(result.suggestions);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    aiSuggestions: suggestions,
    requestAnalysis,
    isProcessing
  };
};

```

## Implementation Approach

1. **Start with the core component**:
    - Implement basic functionality
    - Add necessary features
    - Create the necessary hooks and contexts
2. **Develop the block system integration**:
    - Create the block adapter
    - Implement resize and positioning logic
    - Test integration with other blocks
3. **Add Symphony-specific features**:
    - Integrate with AI conductor
    - Add Symphony extension points
    - Create AI-specific UI elements
4. **Implement settings and configuration**:
    - Create the settings UI
    - Connect settings to component behavior
    - Add persistence layer

## Best Practices

- **Composition over inheritance**: Use React composition patterns to build complex features
- **Clear interfaces**: Define clear interfaces between components and systems
- **Performance optimization**: Use memoization and virtualization for large datasets
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Testing**: Write unit tests for core functionality and integration tests for Symphony features

## Integration with Symphony Core

```tsx
// In Symphony core component
import { SymphonyComponent } from 'frontend/{component}/src/symphony/SymphonyComponent';
import { BlockLayout } from 'frontend/core/src/blocks/BlockLayout';

export const SymphonyIDE = () => {
  return (
    <BlockLayout>
      <SymphonyComponent
        initialValue=""
        componentType="specialized"
        theme="symphony-dark"
      />
      {/* Other blocks */}
    </BlockLayout>
  );
};

```