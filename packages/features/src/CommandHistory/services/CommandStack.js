// CommandStack.js - Simplified command stack for feature
/**
 * CommandStack manages undo/redo stacks
 */
export class CommandStack {
	constructor(maxSize = 1000) {
		this.undoStack = [];
		this.redoStack = [];
		this.maxSize = maxSize;
		this.listeners = [];
	}

	/**
	 * Push a command to the undo stack
	 */
	async push(command) {
		// Execute the command
		await command.execute();

		// Add to undo stack
		this.undoStack.push(command);

		// Clear redo stack
		this.redoStack = [];

		// Trim stack if needed
		if (this.undoStack.length > this.maxSize) {
			this.undoStack.shift();
		}

		this.notifyListeners();
	}

	/**
	 * Undo the last command
	 */
	async undo() {
		if (this.undoStack.length === 0) return false;

		const command = this.undoStack.pop();
		await command.undo();

		this.redoStack.push(command);
		this.notifyListeners();
		return true;
	}

	/**
	 * Redo the last undone command
	 */
	async redo() {
		if (this.redoStack.length === 0) return false;

		const command = this.redoStack.pop();
		await command.execute();

		this.undoStack.push(command);
		this.notifyListeners();
		return true;
	}

	/**
	 * Clear all history
	 */
	clear() {
		this.undoStack = [];
		this.redoStack = [];
		this.notifyListeners();
	}

	/**
	 * Get current state
	 */
	getState() {
		const lastUndo = this.undoStack[this.undoStack.length - 1];
		const lastRedo = this.redoStack[this.redoStack.length - 1];

		return {
			canUndo: this.undoStack.length > 0,
			canRedo: this.redoStack.length > 0,
			undoDescription: lastUndo?.description || null,
			redoDescription: lastRedo?.description || null,
			undoStackSize: this.undoStack.length,
			redoStackSize: this.redoStack.length,
		};
	}

	/**
	 * Get undo stack
	 */
	getUndoStack() {
		return [...this.undoStack];
	}

	/**
	 * Get redo stack
	 */
	getRedoStack() {
		return [...this.redoStack];
	}

	/**
	 * Navigate to specific point in history
	 */
	async navigateTo(index) {
		// Undo until we reach the target index
		while (this.undoStack.length > index) {
			await this.undo();
		}

		// Redo until we reach the target index
		while (this.undoStack.length < index) {
			await this.redo();
		}

		return true;
	}

	/**
	 * Serialize stack for persistence
	 */
	serialize() {
		return {
			undoStack: this.undoStack.map(cmd => cmd.getSerializableData?.() || {}),
			redoStack: this.redoStack.map(cmd => cmd.getSerializableData?.() || {}),
		};
	}

	/**
	 * Restore stack from serialized data
	 */
	restore(data) {
		// Note: This is a simplified version
		// Full implementation would need command reconstruction
		if (data.undoStack) {
			this.undoStack = data.undoStack;
		}
		if (data.redoStack) {
			this.redoStack = data.redoStack;
		}
		this.notifyListeners();
	}

	/**
	 * Add listener for stack changes
	 */
	addListener(listener) {
		this.listeners.push(listener);
	}

	/**
	 * Remove listener
	 */
	removeListener(listener) {
		this.listeners = this.listeners.filter(l => l !== listener);
	}

	/**
	 * Notify all listeners
	 */
	notifyListeners() {
		this.listeners.forEach(listener => listener());
	}
}
