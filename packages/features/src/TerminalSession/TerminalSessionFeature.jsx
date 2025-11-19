// TerminalSessionFeature.jsx - Feature component for terminal session management

import React from 'react';
import { useTerminalSession } from './hooks/useTerminalSession';

/**
 * TerminalSessionFeature - Manages terminal session lifecycle and settings
 * 
 * This feature encapsulates all logic related to terminal initialization,
 * settings management, and session lifecycle using xterm.js.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.children - Render prop function receiving terminal session API
 * @param {Object} props.settings - Terminal settings (font, cursor, theme)
 * @param {string} props.welcomeMessage - Welcome message to display
 * @param {string} props.prompt - Command prompt string
 * @returns {React.Element} Rendered children with terminal session API
 * 
 * @example
 * <TerminalSessionFeature
 *   settings={{ fontSize: 14, fontFamily: 'monospace' }}
 *   welcomeMessage="Welcome!"
 *   prompt="$ "
 * >
 *   {({ terminalRef, terminal, write, writeln, clear }) => (
 *     <div>
 *       <div ref={terminalRef} />
 *       <button onClick={() => clear()}>Clear</button>
 *     </div>
 *   )}
 * </TerminalSessionFeature>
 */
export function TerminalSessionFeature({
  children,
  settings,
  welcomeMessage,
  prompt
}) {
  const sessionAPI = useTerminalSession({
    settings,
    welcomeMessage,
    prompt
  });

  return children(sessionAPI);
}

// Export hook for direct usage
export { useTerminalSession } from './hooks/useTerminalSession';
