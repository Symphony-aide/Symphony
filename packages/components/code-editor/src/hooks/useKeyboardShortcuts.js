// useKeyboardShortcuts.js
import { useEffect } from "react";
import { useCommand } from "@symphony/commands";
import hotkeys from "hotkeys-js";

export function useKeyboardShortcuts({
	shortcuts,
	activeFileName,
	activeFile,
	canUndo,
	canRedo,
	handleDownloadFile,
	handleChange,
	setShowTerminal,
}) {
	const { undo, redo } = useCommand();
	useEffect(() => {
		shortcuts.forEach(({ operation, shortcut }) => {
			if (!shortcut) return;
			hotkeys(shortcut, event => {
				event.preventDefault();
				if (operation === "save") handleDownloadFile(activeFileName);
				else if (operation === "format") handleChange(activeFile?.content.trim() || "");
				else if (operation === "run") console.log("Running code...");
				else if (operation === "toggleTerminal") setShowTerminal(prev => !prev);
			});
		});

		// Note: Undo/Redo shortcuts are now handled by the global command system
		// No need to register them here

		return () => {
			shortcuts.forEach(({ shortcut }) => shortcut && hotkeys.unbind(shortcut));
		};
	}, [shortcuts, activeFileName, activeFile, canUndo, canRedo, undo, redo, handleDownloadFile, handleChange, setShowTerminal]);
}
