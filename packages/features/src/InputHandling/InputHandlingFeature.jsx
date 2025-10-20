// InputHandlingFeature.jsx - Feature component for input handling

import React from 'react';
import { useInputHandling } from './hooks/useInputHandling';

/**
 * InputHandlingFeature - Manages terminal input and keyboard events
 * 
 * This feature encapsulates all logic related to handling terminal input,
 * including keyboard events, buffer management, and special key handling.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving input handling API
 * @param {Object} props.terminal - Terminal instance
 * @param {Object} props.commandHandler - Command execution handler
 * @param {string} props.prompt - Command prompt string
 * @returns {React.Element} Rendered children with input handling API
 * 
 * @example
 * <InputHandlingFeature
 *   terminal={terminalInstance}
 *   commandHandler={commandExecutionAPI}
 *   prompt="$ "
 * >
 *   {({ handleData, getBuffer, clearLine }) => (
 *     <div>
 *       <div>Current input: {getBuffer()}</div>
 *       <button onClick={clearLine}>Clear Line</button>
 *     </div>
 *   )}
 * </InputHandlingFeature>
 */
export function InputHandlingFeature({
  children,
  terminal,
  commandHandler,
  prompt
}) {
  const inputAPI = useInputHandling({
    terminal,
    commandHandler,
    prompt
  });

  return children(inputAPI);
}

// Export hook for direct usage
export { useInputHandling } from './hooks/useInputHandling';
