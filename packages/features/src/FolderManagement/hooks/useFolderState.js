// useFolderState.js
import { useState, useEffect } from "react";
import { storageService } from "../services/storageService";

/**
 * Manages folder state including user-created folders and expansion state
 */
export function useFolderState() {
	// User-created folders state
	const [userFolders, setUserFolders] = useState(() => {
		try {
			return storageService.getSync("explorer.userFolders") || [];
		} catch {
			return [];
		}
	});

	// Expanded folders state
	const [expanded, setExpanded] = useState(() => {
		try {
			return storageService.getSync("explorer.expanded") || {};
		} catch {
			return {};
		}
	});

	// Persist userFolders to storage
	useEffect(() => {
		storageService.setSync("explorer.userFolders", userFolders);
	}, [userFolders]);

	// Persist expanded state to storage
	useEffect(() => {
		storageService.setSync("explorer.expanded", expanded);
	}, [expanded]);

	return {
		userFolders,
		setUserFolders,
		expanded,
		setExpanded,
	};
}
