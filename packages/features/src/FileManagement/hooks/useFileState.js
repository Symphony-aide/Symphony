// useFileState.js
import { useState, useEffect } from "react";
import { storageService } from "../services/storageService";

/**
 * Manages file state including files list, active file, and open tabs
 */
export function useFileState() {
	// Files management
	const [files, setFiles] = useState(() => {
		const saved = storageService.getSync("files");
		return Array.isArray(saved) && saved.length > 0
			? saved
			: [{ name: "untitled.txt", content: "" }];
	});

	// Active file and tabs
	const [activeFileName, setActiveFileName] = useState(
		() => storageService.getSync("activeFileName") || "untitled.txt"
	);

	const [openTabs, setOpenTabs] = useState(() => {
		const saved = storageService.getSync("openTabs");
		return Array.isArray(saved) ? saved : [];
	});

	const [modifiedTabs, setModifiedTabs] = useState([]);
	const [isSaved, setIsSaved] = useState(true);

	// Persist state to storage
	useEffect(() => {
		storageService.set("files", files);
	}, [files]);

	useEffect(() => {
		storageService.set("activeFileName", activeFileName);
	}, [activeFileName]);

	useEffect(() => {
		storageService.set("openTabs", openTabs);
	}, [openTabs]);

	// Get active file object
	const activeFile = files.find(f => f.name === activeFileName);

	return {
		// State
		files,
		setFiles,
		activeFileName,
		setActiveFileName,
		openTabs,
		setOpenTabs,
		modifiedTabs,
		setModifiedTabs,
		isSaved,
		setIsSaved,
		activeFile,
	};
}
