// AutoSaveFeature.jsx
import React from "react";
import { useAutoSave } from "./hooks/useAutoSave";

/**
 * AutoSave Feature Component
 * Provides automatic file saving functionality
 * 
 * @param {Object} props
 * @param {boolean} props.enabled - Whether auto-save is enabled
 * @param {number} props.interval - Save interval in seconds
 * @param {Array} props.files - All files
 * @param {string} props.activeFileName - Active file name
 * @param {boolean} props.isSaved - Whether active file is saved
 * @param {Function} props.setIsSaved - Set saved state
 * @param {Function} props.setModifiedTabs - Set modified tabs
 * @param {Function} props.onAutoSave - Callback when auto-save occurs
 * @param {Function} props.children - Render prop function receiving auto-save state
 * @returns {React.Element}
 */
export function AutoSaveFeature({
	enabled,
	interval,
	files,
	activeFileName,
	isSaved,
	setIsSaved,
	setModifiedTabs,
	onAutoSave,
	children,
}) {
	const autoSaveState = useAutoSave({
		enabled,
		interval,
		files,
		activeFileName,
		isSaved,
		setIsSaved,
		setModifiedTabs,
		onAutoSave,
	});

	// If no children, just run the auto-save effect
	if (!children) return null;

	// Expose auto-save state to children
	return children(autoSaveState);
}

/**
 * Hook version of AutoSave feature
 * Use this when you don't need the render prop pattern
 */
export { useAutoSave } from "./hooks/useAutoSave";
