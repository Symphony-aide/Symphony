/**
 * @fileoverview Undo/Redo toolbar component for Symphony's command system
 */

import React from 'react';
import { useCommandState, useCommand } from '../CommandContext.jsx';

/**
 * UndoRedoToolbar provides undo/redo buttons with tooltips and descriptions
 * Integrates with Symphony's global command system
 */
export default function UndoRedoToolbar({ 
  className = '',
  showDescriptions = true,
  iconSize = 16,
  variant = 'default'
}) {
  const { canUndo, canRedo, undoDescription, redoDescription } = useCommandState();
  const { undo, redo } = useCommand();

  const handleUndo = async () => {
    try {
      await undo();
    } catch (error) {
      console.error('Undo failed:', error);
      // TODO: Show user-friendly error message
    }
  };

  const handleRedo = async () => {
    try {
      await redo();
    } catch (error) {
      console.error('Redo failed:', error);
      // TODO: Show user-friendly error message
    }
  };

  const baseButtonClass = `
    inline-flex items-center justify-center
    px-2 py-1 rounded
    text-sm font-medium
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const enabledButtonClass = `
    ${baseButtonClass}
    text-gray-700 bg-white border border-gray-300
    hover:bg-gray-50 hover:text-gray-900
    focus:ring-blue-500
    cursor-pointer
  `;

  const disabledButtonClass = `
    ${baseButtonClass}
    text-gray-400 bg-gray-100 border border-gray-200
    cursor-not-allowed
  `;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={canUndo ? enabledButtonClass : disabledButtonClass}
        title={undoDescription ? `Undo ${undoDescription}` : 'Undo'}
        aria-label={undoDescription ? `Undo ${undoDescription}` : 'Undo'}
      >
        <UndoIcon size={iconSize} />
        {showDescriptions && (
          <span className="ml-1 hidden sm:inline">
            Undo
          </span>
        )}
      </button>

      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={canRedo ? enabledButtonClass : disabledButtonClass}
        title={redoDescription ? `Redo ${redoDescription}` : 'Redo'}
        aria-label={redoDescription ? `Redo ${redoDescription}` : 'Redo'}
      >
        <RedoIcon size={iconSize} />
        {showDescriptions && (
          <span className="ml-1 hidden sm:inline">
            Redo
          </span>
        )}
      </button>

      {/* Optional: Show current operation descriptions */}
      {showDescriptions && (undoDescription || redoDescription) && (
        <div className="hidden md:flex flex-col text-xs text-gray-500 ml-2">
          {undoDescription && (
            <div className="truncate max-w-32">
              Next: {undoDescription}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Undo icon component
 */
function UndoIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v6h6" />
      <path d="m21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
    </svg>
  );
}

/**
 * Redo icon component
 */
function RedoIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21 7-6-6v6h-6a9 9 0 0 0-9 9 9 9 0 0 0 9 9h6v-6l6 6V7z" />
    </svg>
  );
}
