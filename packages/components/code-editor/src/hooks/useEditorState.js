// useEditorState.js
import { useState, useEffect } from "react";
import { useCommandState } from "@symphony/commands";
import { storageService } from "../utils/storageService.js";
import { useEditorCommands } from "./useEditorCommands.js";

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function useEditorState() {
	// Files management through command system
	const { files, setFiles } = useEditorCommands();

	// Get undo/redo state from global command system
	const { canUndo, canRedo } = useCommandState();

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

		// Undo/Redo (now handled by global command system)
		canUndo,
		canRedo,
	};
}
