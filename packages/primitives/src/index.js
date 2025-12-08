/**
 * @fileoverview Primitives Package - UI Extensibility System for Symphony IDE
 *
 * This package provides a comprehensive UI extensibility system that transforms
 * every UI element into an inspectable, modifiable primitive. It enables Motif
 * extensions to have complete transparency and control over the entire UI.
 *
 * @module @symphony/primitives
 */

// Core exports
export { BasePrimitive } from './core/BasePrimitive.js';
export {
  generateId,
  isNonEmptyString,
  isPlainObject,
  isArray,
  deepClone,
} from './core/utils.js';

// Error types
export {
  PrimitiveError,
  ComponentNotFoundError,
  PathResolutionError,
  WasmLoadError,
} from './core/errors.js';

// Registry exports
export { ComponentRegistry } from './registry/ComponentRegistry.js';


// Layout primitive exports
export { Container, Flex, Grid, Panel, Divider } from './primitives/layout.js';

// Interactive primitive exports
export { Button, Input, Icon, Text, Checkbox, Select } from './primitives/interactive.js';

// Complex primitive exports
export { List, Tabs, Dropdown, Modal, Tooltip } from './primitives/complex.js';

// Heavy WASM primitive exports
export { CodeEditor, Terminal, SyntaxHighlighter, FileTree } from './primitives/heavy.js';


// Renderer exports
export {
  PrimitiveRenderer,
  registerComponent,
  unregisterComponent,
  getRegisteredComponent,
  getRegisteredTypes,
  setPrimitiveRegistry,
  getPrimitiveRegistry,
  convertHandlerProps,
} from './renderers/PrimitiveRenderer.jsx';

export {
  DirectRenderer,
  registerDirectRenderer,
  unregisterDirectRenderer,
  getDirectRenderer,
  getRegisteredDirectTypes,
  MonacoEditorDirect,
  XTermTerminalDirect,
} from './renderers/DirectRenderer.jsx';

export { ErrorBoundary, withErrorBoundary } from './renderers/ErrorBoundary.jsx';

export {
  WasmRenderer,
  setWasmRegistry,
  getWasmRegistry,
  loadWasmModule,
  clearWasmModuleCache,
  getWasmModuleCacheSize,
} from './renderers/WasmRenderer.jsx';


// Hook exports
export {
  useRegisteredComponent,
  setHookRegistry,
  getHookRegistry,
} from './hooks/useRegisteredComponent.js';

// API exports
export { MotifAPI } from './api/MotifAPI.js';

// IPC Bridge exports
export {
  IPCBridge,
  getDefaultBridge,
  setDefaultBridge,
  resetDefaultBridge,
} from './ipc/IPCBridge.js';

// Performance monitoring exports
export {
  PerformanceMonitor,
  getDefaultMonitor,
  setDefaultMonitor,
  resetDefaultMonitor,
} from './monitoring/PerformanceMonitor.js';

// Package version
export const VERSION = '1.0.0';
