// Terminal Component Exports

// Original component (preserved for backward compatibility)
export { default as Terminal } from './src/Terminal.jsx';

// Refactored component (recommended)
export { default as TerminalRefactored } from './src/Terminal.refactored.jsx';

// Pure UI component
export { TerminalUI } from './src/components/TerminalUI.jsx';

// Original hooks (for backward compatibility)
export { useTerminal } from './src/hooks/useTerminal.js';
export { useCommandHandler } from './src/hooks/useCommandHandler.js';
export { useInputHandler } from './src/hooks/useInputHandler.js';