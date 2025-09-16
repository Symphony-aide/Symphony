// useEditorState.js
import { useState, useEffect } from "react";
import useUndo from "use-undo";
import { storageService } from "../utils/storageService.js";

export function useEditorState() {
	// Files management with undo/redo
	const savedFiles = storageService.getSync("files");
	const initialFiles = savedFiles || [{ name: "untitled.txt", content: "" }];
	const [filesState, { set: setFiles, undo, redo, canUndo, canRedo }] = useUndo(initialFiles);
	const files = filesState.present;

	// Active file and tabs
	const [activeFileName, setActiveFileName] = useState(
		() => storageService.getSync("activeFileName") || "untitled.txt"
	);

	const [openTabs, setOpenTabs] = useState(() => {
		const saved = storageService.getSync("openTabs");
		return Array.isArray(saved) ? saved : [];
	});

	const [isSaved, setIsSaved] = useState(true);
	const [modifiedTabs, setModifiedTabs] = useState([]);

	// Terminal visibility
	const [showTerminal, setShowTerminal] = useState(true);

	// Persist state to storage
	useEffect(() => storageService.setSync("files", files), [files]);
	useEffect(() => storageService.setSync("activeFileName", activeFileName), [activeFileName]);
	useEffect(() => storageService.setSync("openTabs", openTabs), [openTabs]);

	return {
		// Files
		files,
		setFiles,
		activeFileName,
		setActiveFileName,
		
		// Tabs
		openTabs,
		setOpenTabs,
		modifiedTabs,
		setModifiedTabs,
		
		// Save state
		isSaved,
		setIsSaved,
		
		// Terminal
		showTerminal,
		setShowTerminal,
		
		// Undo/Redo
		undo,
		redo,
		canUndo,
		canRedo,
	};
}
