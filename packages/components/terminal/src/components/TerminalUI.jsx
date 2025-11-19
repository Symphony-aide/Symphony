// TerminalUI.jsx - Pure UI component for terminal display

import React from 'react';
import '@xterm/xterm/css/xterm.css';

/**
 * TerminalUI - Pure presentational component for terminal display
 * 
 * Displays a terminal container with xterm.js styling.
 * 
 * @param {Object} props - Component props
 * @param {React.Ref} props.terminalRef - Ref for terminal container
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {string} props.height - Terminal height
 * @param {string} props.width - Terminal width
 * @returns {React.Element} Terminal UI
 */
export function TerminalUI({
  terminalRef,
  className = '',
  style = {},
  height = '200px',
  width = '100%'
}) {
  const defaultClassName = 'bg-black rounded-lg border border-gray-700 overflow-hidden';
  const combinedClassName = `${defaultClassName} ${className}`.trim();

  const defaultStyle = {
    height,
    width,
    ...style
  };

  return (
    <div
      ref={terminalRef}
      className={combinedClassName}
      style={defaultStyle}
      role="terminal"
      aria-label="Terminal"
    />
  );
}
