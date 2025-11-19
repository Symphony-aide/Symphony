// useCommandHistory.js
import { useState, useCallback, useEffect } from "react";
import { CommandStack } from "../services/CommandStack";
import { storageService } from "../services/storageService";

/**
 * Manages command history with undo/redo functionality
 * @param {Object} options - Configuration options
 * @param {number} options.maxStackSize - Maximum commands in stack
 * @param {boolean} options.enablePersistence - Whether to persist history
 * @returns {Object} Command history state and operations
 */
export function useCommandHistory(options = {}) {
	const {
		maxStackSize = 1000,
		enablePersistence = true,
	} = options;

	// Initialize command stack
	const [stack] = useState(() => new CommandStack(maxStackSize));
	
	// History state
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [undoDescription, setUndoDescription] = useState(null);
	const [redoDescription, setRedoDescription] = useState(null);
	const [undoStackSize, setUndoStackSize] = useState(0);
	const [redoStackSize, setRedoStackSize] = useState(0);

	// Update state from stack
	const updateState = useCallback(() => {
		const state = stack.getState();
		setCanUndo(state.canUndo);
		setCanRedo(state.canRedo);
		setUndoDescription(state.undoDescription);
		setRedoDescription(state.redoDescription);
		setUndoStackSize(state.undoStackSize);
		setRedoStackSize(state.redoStackSize);
	}, [stack]);

	// Load persisted history
	useEffect(() => {
		if (enablePersistence) {
			try {
				const saved = storageService.getSync("commandHistory");
				if (saved) {
					stack.restore(saved);
					updateState();
				}
			} catch (error) {
				console.error("Failed to load command history:", error);
			}
		}
	}, [enablePersistence, stack, updateState]);

	// Persist history on changes
	useEffect(() => {
		if (enablePersistence) {
			const listener = () => {
				try {
					const state = stack.serialize();
					storageService.setSync("commandHistory", state);
				} catch (error) {
					console.error("Failed to persist command history:", error);
				}
			};
			
			stack.addListener(listener);
			return () => stack.removeListener(listener);
		}
	}, [enablePersistence, stack]);

	// Push command to history
	const push = useCallback(async (command) => {
		try {
			await stack.push(command);
			updateState();
			return true;
		} catch (error) {
			console.error("Failed to push command:", error);
			return false;
		}
	}, [stack, updateState]);

	// Undo last command
	const undo = useCallback(async () => {
		try {
			const success = await stack.undo();
			updateState();
			return success;
		} catch (error) {
			console.error("Failed to undo:", error);
			return false;
		}
	}, [stack, updateState]);

	// Redo last undone command
	const redo = useCallback(async () => {
		try {
			const success = await stack.redo();
			updateState();
			return success;
		} catch (error) {
			console.error("Failed to redo:", error);
			return false;
		}
	}, [stack, updateState]);

	// Clear history
	const clear = useCallback(() => {
		stack.clear();
		updateState();
	}, [stack, updateState]);

	// Get history snapshot
	const getSnapshot = useCallback(() => {
		return {
			undoStack: stack.getUndoStack(),
			redoStack: stack.getRedoStack(),
		};
	}, [stack]);

	// Navigate to specific point in history
	const navigateTo = useCallback(async (index) => {
		try {
			const success = await stack.navigateTo(index);
			updateState();
			return success;
		} catch (error) {
			console.error("Failed to navigate history:", error);
			return false;
		}
	}, [stack, updateState]);

	return {
		// State
		canUndo,
		canRedo,
		undoDescription,
		redoDescription,
		undoStackSize,
		redoStackSize,

		// Operations
		push,
		undo,
		redo,
		clear,
		getSnapshot,
		navigateTo,

		// Direct stack access (for advanced use)
		stack,
	};
}
