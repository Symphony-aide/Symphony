# Symphony Extension System Guide

## Overview

This guide covers Symphony's extension architecture, which balances centralization and component-specific extensions to enable flexible, AI-enhanced functionality across the IDE.

> 💡 Read More at
> 
> 
> [extension-architecture.md](extension-architecture.md)
> 

## Extension Architecture: Hybrid Approach

Symphony uses a hybrid extension architecture that combines:

- **Centralized Extension System**: For cross-component functionality
- **Component-Specific Extensions**: For specialized features
- **Extension Bridge**: For communication between systems

### Centralized Extension System

Located in the root-level `extensions/` directory:

```
symphony-ide/
├── 📁 extensions/                     # AI-Harmonized Extensions
│   └── builtin/                       # Built-in extensions (AI-enhanced)
│       ├── typescript-lsp/
│       │   ├── backend/               # Traditional + AI features (Rust)
│       │   ├── frontend/              # UI with AI integration + Jotai
│       │   └── ai-integration/        # Python AI model integration

```

### Advantages

- Unified Extension API
- Cross-Component Extensions
- Simplified Discovery
- Centralized Lifecycle Management
- Reduced Duplication

### Disadvantages

- Tight Coupling
- Overhead for Simple Extensions
- API Maintenance Burden
- Versioning Challenges

### Component-Specific Extensions

Each component implements its own extension system:

```
frontend/
  ├── {component}/
  │   ├── src/
  │   │   ├── extensions/
  │   │   │   ├── types.ts                # Extension interface definitions
  │   │   │   ├── registry.ts             # Registration system
  │   │   │   └── core/                   # Built-in extensions

```

### Advantages

- Focused Functionality
- Independent Evolution
- Simpler Implementation
- Reduced Dependencies
- Faster Development

### Disadvantages

- Potential Duplication
- Inconsistent APIs
- Integration Challenges
- Discovery Issues
- Management Overhead

## Extension Interface Definition

Extensions follow a plugin architecture with well-defined interfaces:

```tsx
// types.ts
export interface ComponentExtension {
  id: string;
  name: string;
  version: string;
  activate: (component: ComponentInstance) => void;
  deactivate: () => void;
  contributes?: {
    themes?: ThemeContribution[];
    languages?: LanguageContribution[];
    commands?: CommandContribution[];
  };
}

// registry.ts
export class ExtensionRegistry {
  private extensions: Map<string, ComponentExtension> = new Map();

  register(extension: ComponentExtension): void {
    this.extensions.set(extension.id, extension);
  }

  getExtension(id: string): ComponentExtension | undefined {
    return this.extensions.get(id);
  }

  activateExtension(id: string, component: ComponentInstance): void {
    const extension = this.getExtension(id);
    if (extension) {
      extension.activate(component);
    }
  }
}

```

## Extension Bridge Pattern

The Extension Bridge connects component-specific and centralized systems:

```tsx
// ExtensionBridge.ts
export class ExtensionBridge {
  private static instance: ExtensionBridge;
  private componentRegistries: Map<string, ComponentRegistry> = new Map();
  private globalRegistry: GlobalRegistry;

  static getInstance(): ExtensionBridge {
    if (!ExtensionBridge.instance) {
      ExtensionBridge.instance = new ExtensionBridge();
    }
    return ExtensionBridge.instance;
  }

  // Register a component's extension registry
  registerComponentRegistry(componentId: string, registry: ComponentRegistry): void {
    this.componentRegistries.set(componentId, registry);

    // Register component-specific extension points with global system
    registry.getExtensionPoints().forEach(point => {
      this.globalRegistry.registerExtensionPoint(componentId, point);
    });
  }

  // Get extensions that apply to a specific component
  getExtensionsForComponent(componentId: string): Extension[] {
    return [
      ...this.globalRegistry.getExtensionsForComponent(componentId),
      ...this.getComponentRegistry(componentId)?.getExtensions() || []
    ];
  }

  // Allow component to access global services
  getGlobalService(serviceId: string): any {
    return this.globalRegistry.getService(serviceId);
  }
}

```

## Component Extension Registry

```tsx
// ComponentExtensionRegistry.ts
export class ComponentExtensionRegistry implements ComponentRegistry {
  private extensions: Map<string, ComponentExtension> = new Map();
  private extensionPoints: ExtensionPoint[] = [];

  constructor(componentId: string) {
    // Define component-specific extension points
    this.extensionPoints = [
      { id: `${componentId}.completion`, name: 'Component Completion' },
      { id: `${componentId}.formatting`, name: 'Component Formatting' }
    ];

    // Register with the global system
    ExtensionBridge.getInstance().registerComponentRegistry(componentId, this);
  }

  // Get all extensions for this component (local + global)
  getAllExtensions(): Extension[] {
    return ExtensionBridge.getInstance().getExtensionsForComponent(this.componentId);
  }

  // Register a local extension
  registerExtension(extension: ComponentExtension): void {
    this.extensions.set(extension.id, extension);
  }

  // Access global services when needed
  getAIService(): AIService {
    return ExtensionBridge.getInstance().getGlobalService('ai.service');
  }
}

```

## Theme System

Extensions can contribute themes through the theme provider:

```tsx
// ThemeProvider.tsx
export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  tokenColors: TokenColorRule[];
}

const ThemeContext = createContext<{
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  registerTheme: (theme: Theme) => void;
}>({
  currentTheme: defaultTheme,
  setTheme: () => {},
  availableThemes: [defaultTheme],
  registerTheme: () => {}
});

export const ThemeProvider: React.FC = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState(defaultTheme.id);
  const [themes, setThemes] = useState<Theme[]>([defaultTheme]);

  const registerTheme = (theme: Theme) => {
    setThemes(prev => [...prev, theme]);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: themes.find(t => t.id === currentThemeId) || defaultTheme,
        setTheme: setCurrentThemeId,
        availableThemes: themes,
        registerTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

```

## Extension Points for AI Features

```tsx
// ExtensionPoints.ts
export class SymphonyExtensionPoints {
  static COMPLETION = 'symphony.completion';
  static ANALYSIS = 'symphony.analysis';
  static DOCUMENTATION = 'symphony.documentation';
  static REFACTORING = 'symphony.refactoring';

  static getActiveExtensions() {
    return [
      {
        id: 'symphony.ai-completion',
        name: 'AI Completion',
        activate: (component) => {
          // Register AI completion provider
        }
      }
    ];
  }
}

```

## Extension Manifest

Extensions declare their capabilities in a manifest:

```json
{
  "id": "symphony.component-extension",
  "name": "Symphony Component Extension",
  "version": "1.0.0",
  "contributes": {
    "themes": [
      {
        "id": "custom-theme",
        "label": "Custom Theme",
        "uiTheme": "vs-dark",
        "path": "./themes/custom-theme.json"
      }
    ],
    "commands": [
      {
        "command": "component.action",
        "title": "Component Action"
      }
    ]
  }
}

```

## Recommended Implementation

1. **Create a dedicated extension package** for cross-cutting concerns
2. **Allow component-specific extension logic** for specialized features
3. **Use the Extension Bridge** to connect systems
4. **Follow consistent patterns** across all components

This hybrid approach provides:

- Centralized extension management and discovery
- Component-specific extension points for specialized features
- Cross-component communication when needed
- Isolation when appropriate

The architecture aligns with Symphony's AI orchestration model where the conductor manages interactions between specialized components while maintaining their domain expertise.