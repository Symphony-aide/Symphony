// useAutoSave.js
import { useEffect, useState } from "react";
import { storageService } from "../services/storageService";

/**
 * Auto-save functionality hook
 * Automatically saves files at specified intervals
 * 
 * @param {Object} params
 * @param {boolean} params.enabled - Whether auto-save is enabled
 * @param {number} params.interval - Save interval in seconds
 * @param {Array} params.files - All files
 * @param {string} params.activeFileName - Active file name
 * @param {boolean} params.isSaved - Whether active file is saved
 * @param {Function} params.setIsSaved - Set saved state
 * @param {Function} params.setModifiedTabs - Set modified tabs
 * @param {Function} params.onAutoSave - Callback when auto-save occurs
 */
export function useAutoSave({
	enabled = false,
	interval = 2,
	files,
	activeFileName,
	isSaved,
	setIsSaved,
	setModifiedTabs,
	onAutoSave,
}) {
	const [lastSaved, setLastSaved] = useState(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!enabled) return;

		const activeFile = files?.find(f => f.name === activeFileName);
		if (!activeFile) return;

		const timer = setInterval(async () => {
			if (!isSaved && activeFile) {
				setIsSaving(true);
				
				try {
					// Save to storage
					await storageService.set("files", files);
					
					// Update state
					setIsSaved(true);
					setModifiedTabs(prev => prev.filter(tab => tab !== activeFileName));
					setLastSaved(new Date());
					
					// Callback
					if (onAutoSave) {
						onAutoSave({ fileName: activeFileName, timestamp: new Date() });
					}
					
					console.log("Auto-saved to storage:", activeFileName);
				} catch (error) {
					console.error("Auto-save failed:", error);
				} finally {
					setIsSaving(false);
				}
			}
		}, interval * 1000);

		return () => clearInterval(timer);
	}, [enabled, interval, isSaved, activeFileName, files, setIsSaved, setModifiedTabs, onAutoSave]);

	return {
		isSaving,
		lastSaved,
		enabled,
	};
}
