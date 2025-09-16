// useKeyboardShortcuts.js
import { useEffect } from "react";
import hotkeys from "hotkeys-js";

export function useKeyboardShortcuts({
	shortcuts,
	activeFileName,
	activeFile,
	canUndo,
	canRedo,
	undo,
	redo,
	handleDownloadFile,
	handleChange,
	setShowTerminal,
}) {
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

		hotkeys("ctrl+z", e => {
			e.preventDefault();
			if (canUndo) undo();
		});

		hotkeys("ctrl+y, ctrl+shift+z", e => {
			e.preventDefault();
			if (canRedo) redo();
		});

		return () => {
			shortcuts.forEach(({ shortcut }) => shortcut && hotkeys.unbind(shortcut));
			hotkeys.unbind("ctrl+z");
			hotkeys.unbind("ctrl+y");
			hotkeys.unbind("ctrl+shift+z");
		};
	}, [shortcuts, activeFileName, activeFile, canUndo, canRedo, undo, redo, handleDownloadFile, handleChange, setShowTerminal]);
}
