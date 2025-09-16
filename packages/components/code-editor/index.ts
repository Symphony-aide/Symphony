// Code Editor Component Exports
export { default as Editor } from './src/Editor.jsx';
export { default as EditorPanel } from './src/EditorPanel.jsx';
export { default as FilesProvider } from './src/FilesProvider.jsx';
export { default as monacoOptions } from './src/monacoOptions.js';

// Sub-components
export { default as LayoutManager } from "./src/components/LayoutManager.jsx";
export { createLayoutFactory } from "./src/components/LayoutFactory.jsx";
export { default as SettingsPanel } from "./src/components/SettingsPanel.jsx";

// Custom Hooks
export { useEditorState } from './src/hooks/useEditorState.js';
export { useEditorSettings } from './src/hooks/useEditorSettings.js';
export { useFileOperations } from './src/hooks/useFileOperations.js';
export { useKeyboardShortcuts } from './src/hooks/useKeyboardShortcuts.js';
export { useAutoSave } from './src/hooks/useAutoSave.js';
export { useOutlineManager } from './src/hooks/useOutlineManager.js';