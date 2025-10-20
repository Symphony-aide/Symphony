// useUndoRedo.js
import { useCallback } from "react";
import { useCommandHistory } from "./useCommandHistory";

/**
 * Simplified hook for undo/redo functionality
 * @param {Object} options - Configuration options
 * @returns {Object} Undo/redo state and operations
 */
export function useUndoRedo(options = {}) {
	const history = useCommandHistory(options);

	// Simplified API focused on undo/redo
	return {
		// State
		canUndo: history.canUndo,
		canRedo: history.canRedo,
		undoDescription: history.undoDescription,
		redoDescription: history.redoDescription,

		// Operations
		undo: history.undo,
		redo: history.redo,

		// For executing commands
		execute: history.push,
	};
}

/**
 * Hook for keyboard shortcuts integration
 * @param {Object} undoRedo - Undo/redo instance from useUndoRedo
 * @param {Object} options - Keyboard shortcut options
 */
export function useUndoRedoShortcuts(undoRedo, options = {}) {
	const {
		undoKey = 'z',
		redoKey = 'y',
		modifierKey = 'ctrl',
	} = options;

	const handleKeyDown = useCallback((e) => {
		const isModifier = modifierKey === 'ctrl' ? e.ctrlKey : e.metaKey;
		
		if (isModifier && e.key.toLowerCase() === undoKey && !e.shiftKey) {
			e.preventDefault();
			if (undoRedo.canUndo) {
				undoRedo.undo();
			}
		} else if (isModifier && (
			(e.key.toLowerCase() === redoKey) ||
			(e.key.toLowerCase() === undoKey && e.shiftKey)
		)) {
			e.preventDefault();
			if (undoRedo.canRedo) {
				undoRedo.redo();
			}
		}
	}, [undoRedo, undoKey, redoKey, modifierKey]);

	return { handleKeyDown };
}
