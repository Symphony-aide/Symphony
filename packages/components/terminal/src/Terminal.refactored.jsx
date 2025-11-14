// Terminal.refactored.jsx - Refactored Terminal using features

import React from 'react';
import {
  TerminalSessionFeature,
  CommandExecutionFeature,
  InputHandlingFeature
} from '@symphony/features';
import { TerminalUI } from './components/TerminalUI';

/**
 * Terminal - Integrated terminal component using features
 * 
 * This component integrates TerminalSession, CommandExecution, and InputHandling features
 * with the pure TerminalUI component following the [Page, Feature, Component] pattern.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.terminalSettings - Terminal settings (font, cursor, theme)
 * @param {string} props.welcomeMessage - Welcome message to display
 * @param {string} props.prompt - Command prompt string
 * @param {Object} props.customCommands - Custom command definitions
 * @param {number} props.maxHistorySize - Maximum history size
 * @param {boolean} props.enableAutocomplete - Enable tab autocomplete
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.height - Terminal height
 * @param {string} props.width - Terminal width
 * @returns {React.Element} Terminal component
 * 
 * @example
 * <Terminal
 *   terminalSettings={{ fontSize: 14, fontFamily: 'monospace' }}
 *   welcomeMessage="Welcome to Terminal!"
 *   prompt="$ "
 *   customCommands={{
 *     greet: (_, args) => `Hello ${args[0] || 'World'}!`
 *   }}
 *   height="300px"
 * />
 */
export default function Terminal({
  terminalSettings = {},
  welcomeMessage = 'Welcome to Terminal Commander Pro 🚀',
  prompt = '> ',
  customCommands = {},
  maxHistorySize = 100,
  enableAutocomplete = true,
  className = '',
  height = '200px',
  width = '100%'
}) {
  return (
    <TerminalSessionFeature
      settings={terminalSettings}
      welcomeMessage={welcomeMessage}
      prompt={prompt}
    >
      {(sessionAPI) => (
        <CommandExecutionFeature
          customCommands={customCommands}
          maxHistorySize={maxHistorySize}
          enableAutocomplete={enableAutocomplete}
        >
          {(executionAPI) => (
            <InputHandlingFeature
              terminal={sessionAPI.terminal}
              commandHandler={executionAPI}
              prompt={prompt}
            >
              {(inputAPI) => {
                // Set up data handler when terminal and input handler are ready
                React.useEffect(() => {
                  if (sessionAPI.terminal && inputAPI.handleData) {
                    const disposable = sessionAPI.onData(inputAPI.handleData);
                    return () => disposable?.dispose?.();
                  }
                }, [sessionAPI.terminal, inputAPI.handleData]);

                return (
                  <TerminalUI
                    terminalRef={sessionAPI.terminalRef}
                    className={className}
                    height={height}
                    width={width}
                  />
                );
              }}
            </InputHandlingFeature>
          )}
        </CommandExecutionFeature>
      )}
    </TerminalSessionFeature>
  );
}

// Export UI component for custom usage
export { TerminalUI } from './components/TerminalUI';
