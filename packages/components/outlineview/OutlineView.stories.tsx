import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Provider, atom, useSetAtom } from 'jotai';
import OutlineView from './src/OutlineView.jsx';
import { outlineAtom } from './src/outlineAtom.js';

// Mock action function for Storybook
const action = (name: string) => (...args: any[]) => {
  console.log(`${name}:`, ...args);
};

// Define types for outline items
interface OutlineItem {
  type: string;
  name: string;
  line: number;
  column?: number;
  kind?: string;
  detail?: string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

// Create a wrapper component that provides the jotai context with mock data
const OutlineViewWrapper: React.FC<{ outline: OutlineItem[]; onSelectItem?: (item: OutlineItem) => void }> = ({
  outline,
  onSelectItem
}) => {
  const setOutline = useSetAtom(outlineAtom);
  
  React.useEffect(() => {
    setOutline(outline);
  }, [outline, setOutline]);
  
  return (
    <div style={{ width: '280px', height: '500px' }}>
      <OutlineView onSelectItem={onSelectItem} />
    </div>
  );
};

// Main wrapper with Provider
const OutlineViewStoryWrapper: React.FC<{ outline: OutlineItem[]; onSelectItem?: (item: OutlineItem) => void }> = ({
  outline,
  onSelectItem
}) => {
  return (
    <Provider>
      <OutlineViewWrapper outline={outline} onSelectItem={onSelectItem} />
    </Provider>
  );
};

// Sample outline data for different programming languages and scenarios
const javascriptOutline: OutlineItem[] = [
  { type: 'import', name: 'React', line: 1, detail: 'from "react"' },
  { type: 'import', name: 'useState', line: 1, detail: 'from "react"' },
  { type: 'import', name: 'useEffect', line: 1, detail: 'from "react"' },
  { type: 'function', name: 'App', line: 4, detail: 'React component' },
  { type: 'const', name: 'initialState', line: 5, detail: '{ count: 0 }' },
  { type: 'const', name: 'count', line: 6, detail: 'useState hook' },
  { type: 'const', name: 'setCount', line: 6, detail: 'useState setter' },
  { type: 'function', name: 'handleIncrement', line: 8, detail: 'event handler' },
  { type: 'function', name: 'handleDecrement', line: 12, detail: 'event handler' },
  { type: 'hook', name: 'useEffect', line: 16, detail: 'side effect hook' },
  { type: 'export', name: 'App', line: 25, detail: 'default export' }
];

const typescriptOutline: OutlineItem[] = [
  { type: 'interface', name: 'User', line: 1, detail: 'type definition' },
  { type: 'interface', name: 'ApiResponse', line: 6, detail: 'generic type' },
  { type: 'type', name: 'Status', line: 11, detail: 'union type' },
  { type: 'class', name: 'UserService', line: 13, detail: 'service class' },
  { type: 'property', name: 'baseUrl', line: 14, detail: 'private readonly' },
  { type: 'constructor', name: 'constructor', line: 16, detail: 'class constructor' },
  { type: 'method', name: 'getUser', line: 20, detail: 'async method' },
  { type: 'method', name: 'updateUser', line: 28, detail: 'async method' },
  { type: 'method', name: 'deleteUser', line: 36, detail: 'async method' },
  { type: 'function', name: 'createUserService', line: 44, detail: 'factory function' },
  { type: 'export', name: 'UserService', line: 48, detail: 'named export' }
];

const pythonOutline: OutlineItem[] = [
  { type: 'import', name: 'os', line: 1, detail: 'standard library' },
  { type: 'import', name: 'json', line: 2, detail: 'standard library' },
  { type: 'import', name: 'requests', line: 3, detail: 'third-party' },
  { type: 'class', name: 'DataProcessor', line: 5, detail: 'main class' },
  { type: 'method', name: '__init__', line: 6, detail: 'constructor' },
  { type: 'method', name: 'load_data', line: 10, detail: 'public method' },
  { type: 'method', name: '_validate_data', line: 18, detail: 'private method' },
  { type: 'method', name: 'process', line: 26, detail: 'public method' },
  { type: 'method', name: 'save_results', line: 34, detail: 'public method' },
  { type: 'function', name: 'main', line: 42, detail: 'entry point' },
  { type: 'variable', name: '__name__', line: 48, detail: 'module guard' }
];

const cssOutline: OutlineItem[] = [
  { type: 'variable', name: '--primary-color', line: 2, detail: 'CSS custom property' },
  { type: 'variable', name: '--secondary-color', line: 3, detail: 'CSS custom property' },
  { type: 'variable', name: '--font-size-base', line: 4, detail: 'CSS custom property' },
  { type: 'class', name: '.container', line: 7, detail: 'layout class' },
  { type: 'class', name: '.header', line: 15, detail: 'component class' },
  { type: 'class', name: '.nav', line: 23, detail: 'navigation class' },
  { type: 'class', name: '.nav-item', line: 31, detail: 'navigation item' },
  { type: 'class', name: '.content', line: 39, detail: 'main content' },
  { type: 'class', name: '.footer', line: 47, detail: 'footer component' },
  { type: 'class', name: '.btn', line: 55, detail: 'button component' },
  { type: 'class', name: '.btn-primary', line: 63, detail: 'button variant' }
];

const jsonOutline: OutlineItem[] = [
  { type: 'property', name: 'name', line: 2, detail: '"my-app"' },
  { type: 'property', name: 'version', line: 3, detail: '"1.0.0"' },
  { type: 'property', name: 'description', line: 4, detail: 'package description' },
  { type: 'property', name: 'main', line: 5, detail: '"index.js"' },
  { type: 'property', name: 'scripts', line: 6, detail: 'npm scripts object' },
  { type: 'property', name: 'dependencies', line: 12, detail: 'production deps' },
  { type: 'property', name: 'devDependencies', line: 18, detail: 'development deps' },
  { type: 'property', name: 'keywords', line: 24, detail: 'array of strings' },
  { type: 'property', name: 'author', line: 25, detail: 'package author' },
  { type: 'property', name: 'license', line: 26, detail: '"MIT"' }
];

const emptyOutline: OutlineItem[] = [];

const largeOutline: OutlineItem[] = [
  ...javascriptOutline,
  ...typescriptOutline,
  { type: 'namespace', name: 'Utils', line: 50, detail: 'utility namespace' },
  { type: 'function', name: 'debounce', line: 52, detail: 'utility function' },
  { type: 'function', name: 'throttle', line: 60, detail: 'utility function' },
  { type: 'function', name: 'deepClone', line: 68, detail: 'utility function' },
  { type: 'class', name: 'EventEmitter', line: 76, detail: 'event system' },
  { type: 'method', name: 'on', line: 78, detail: 'event listener' },
  { type: 'method', name: 'off', line: 86, detail: 'remove listener' },
  { type: 'method', name: 'emit', line: 94, detail: 'trigger event' },
  { type: 'enum', name: 'HttpStatus', line: 102, detail: 'status codes' },
  { type: 'type', name: 'ApiEndpoint', line: 110, detail: 'endpoint type' },
  { type: 'interface', name: 'Config', line: 118, detail: 'app configuration' }
];

const meta: Meta<typeof OutlineViewStoryWrapper> = {
  title: 'Components/OutlineView',
  component: OutlineViewStoryWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'OutlineView - A code outline/symbol navigator component that displays a hierarchical view of code symbols like functions, classes, variables, and imports with syntax highlighting and interactive navigation.'
      }
    }
  },
  argTypes: {
    outline: {
      control: 'object',
      description: 'Array of outline items with type, name, line, and optional details'
    },
    onSelectItem: {
      action: 'item-selected',
      description: 'Callback function called when an outline item is clicked'
    }
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof OutlineViewStoryWrapper>;

export const Default: Story = {
  args: {
    outline: javascriptOutline,
    onSelectItem: action('item-selected'),
  },
};

export const EmptyState: Story = {
  args: {
    outline: emptyOutline,
    onSelectItem: action('item-selected'),
  },
};

export const JavaScriptFile: Story = {
  args: {
    outline: javascriptOutline,
    onSelectItem: action('item-selected'),
  },
};

export const TypeScriptFile: Story = {
  args: {
    outline: typescriptOutline,
    onSelectItem: action('item-selected'),
  },
};

export const PythonFile: Story = {
  args: {
    outline: pythonOutline,
    onSelectItem: action('item-selected'),
  },
};

export const CSSFile: Story = {
  args: {
    outline: cssOutline,
    onSelectItem: action('item-selected'),
  },
};

export const JSONFile: Story = {
  args: {
    outline: jsonOutline,
    onSelectItem: action('item-selected'),
  },
};

export const LargeFile: Story = {
  args: {
    outline: largeOutline,
    onSelectItem: action('item-selected'),
  },
};

export const FunctionsOnly: Story = {
  args: {
    outline: javascriptOutline.filter(item => 
      ['function', 'method', 'hook'].includes(item.type)
    ),
    onSelectItem: action('item-selected'),
  },
};

export const ClassesAndInterfaces: Story = {
  args: {
    outline: typescriptOutline.filter(item => 
      ['class', 'interface', 'type', 'enum'].includes(item.type)
    ),
    onSelectItem: action('item-selected'),
  },
};

export const ImportsAndExports: Story = {
  args: {
    outline: [
      ...javascriptOutline.filter(item => ['import', 'export'].includes(item.type)),
      ...typescriptOutline.filter(item => ['import', 'export'].includes(item.type)),
      { type: 'import', name: 'lodash', line: 1, detail: 'from "lodash"' },
      { type: 'import', name: 'moment', line: 2, detail: 'from "moment"' },
      { type: 'export', name: 'utils', line: 50, detail: 'named export' },
      { type: 'export', name: 'constants', line: 51, detail: 'named export' }
    ],
    onSelectItem: action('item-selected'),
  },
};
