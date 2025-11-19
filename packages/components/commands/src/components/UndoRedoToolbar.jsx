/**
 * @fileoverview Undo/Redo toolbar component for Symphony's command system
 */

import React from 'react';
import { useCommandState, useCommand } from '../CommandContext.jsx';
import { Button } from 'ui';

/**
 * UndoRedoToolbar provides undo/redo buttons with tooltips and descriptions
 * Integrates with Symphony's global command system
 */
export default function UndoRedoToolbar({ 
  className = '',
  showDescriptions = true,
  iconSize = 16,
  variant = 'default',
  showLabels = false
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

  const handleRedo = () => {
    if (canRedo) {
      redo();
    }
  };

  const getUndoDescription = () => undoDescription || '';
  const getRedoDescription = () => redoDescription || '';
  const buttonSize = iconSize > 16 ? 'default' : 'sm';

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Undo Button */}
      <Button
        onClick={handleUndo}
        disabled={!canUndo}
        variant={canUndo ? "secondary" : "ghost"}
        size={buttonSize}
        className={canUndo ? "bg-secondary hover:bg-secondary/80" : "bg-muted text-muted-foreground cursor-not-allowed"}
        title={canUndo ? `Undo: ${getUndoDescription()}` : 'Nothing to undo'}
        aria-label={`Undo ${canUndo ? getUndoDescription() : ''}`}
      >
        <span className="flex items-center space-x-1">
          <UndoIcon size={iconSize} />
          {showLabels && <span className="text-xs">Undo</span>}
        </span>
      </Button>

      {/* Redo Button */}
      <Button
        onClick={handleRedo}
        disabled={!canRedo}
        variant={canRedo ? "secondary" : "ghost"}
        size={buttonSize}
        className={canRedo ? "bg-secondary hover:bg-secondary/80" : "bg-muted text-muted-foreground cursor-not-allowed"}
        title={canRedo ? `Redo: ${getRedoDescription()}` : 'Nothing to redo'}
        aria-label={`Redo ${canRedo ? getRedoDescription() : ''}`}
      >
        <span className="flex items-center space-x-1">
          <RedoIcon size={iconSize} />
          {showLabels && <span className="text-xs">Redo</span>}
        </span>
      </Button>
      {showDescriptions && (undoDescription || redoDescription) && (
        <div className="hidden md:flex flex-col text-xs text-muted-foreground ml-2">
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
