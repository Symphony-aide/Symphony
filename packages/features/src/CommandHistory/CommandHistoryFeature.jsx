// CommandHistoryFeature.jsx
import React from "react";
import { useCommandHistory } from "./hooks/useCommandHistory";

/**
 * CommandHistory Feature Component
 * Manages command history with undo/redo functionality
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving history API
 * @param {number} props.maxStackSize - Maximum commands in stack
 * @param {boolean} props.enablePersistence - Whether to persist history
 * @returns {React.Element}
 */
export function CommandHistoryFeature({ 
	children, 
	maxStackSize = 1000,
	enablePersistence = true
}) {
	const history = useCommandHistory({
		maxStackSize,
		enablePersistence,
	});

	// Expose clean API to consumers
	const api = {
		// State
		canUndo: history.canUndo,
		canRedo: history.canRedo,
		undoDescription: history.undoDescription,
		redoDescription: history.redoDescription,
		undoStackSize: history.undoStackSize,
		redoStackSize: history.redoStackSize,

		// Operations
		push: history.push,
		undo: history.undo,
		redo: history.redo,
		clear: history.clear,
		getSnapshot: history.getSnapshot,
		navigateTo: history.navigateTo,

		// Direct stack access
		stack: history.stack,
	};

	return children(api);
}

/**
 * Hook version of CommandHistory feature
 * Use this when you don't need the render prop pattern
 */
export { useCommandHistory } from "./hooks/useCommandHistory";
export { useUndoRedo, useUndoRedoShortcuts } from "./hooks/useUndoRedo";
