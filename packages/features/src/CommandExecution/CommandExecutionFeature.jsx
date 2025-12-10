// CommandExecutionFeature.jsx - Feature component for command execution

import React from 'react';
import { useCommandExecution } from './hooks/useCommandExecution';

/**
 * CommandExecutionFeature - Manages command execution and history
 * 
 * This feature encapsulates all logic related to executing terminal commands,
 * managing command history, and providing autocomplete suggestions.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving command execution API
 * @param {Object} props.customCommands - Custom command definitions
 * @param {number} props.maxHistorySize - Maximum history size
 * @param {boolean} props.enableAutocomplete - Enable tab autocomplete
 * @returns {React.Element} Rendered children with command execution API
 * 
 * @example
 * <CommandExecutionFeature
 *   customCommands={{
 *     greet: (_, args) => `Hello ${args[0] || 'World'}!`
 *   }}
 *   maxHistorySize={50}
 *   enableAutocomplete={true}
 * >
 *   {({ handleCommand, getHistory, registerCommand }) => (
 *     <div>
 *       <button onClick={() => handleCommand('help', terminal)}>
 *         Run Help
 *       </button>
 *       <div>History: {getHistory().length} commands</div>
 *     </div>
 *   )}
 * </CommandExecutionFeature>
 */
export function CommandExecutionFeature({
  children,
  customCommands,
  maxHistorySize,
  enableAutocomplete
}) {
  const executionAPI = useCommandExecution({
    customCommands,
    maxHistorySize,
    enableAutocomplete
  });

  return children(executionAPI);
}

// Export hook for direct usage
export { useCommandExecution } from './hooks/useCommandExecution';
