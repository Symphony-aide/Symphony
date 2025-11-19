// useAutoSave.js
import { useEffect } from "react";
import { storageService } from "../utils/storageService.js";

export function useAutoSave({
	autoSaveSettings,
	files,
	isSaved,
	setIsSaved,
	activeFileName,
	setModifiedTabs,
}) {
	useEffect(() => {
		if (!autoSaveSettings.enabled) return;

		const activeFile = files.find(f => f.name === activeFileName);
		if (!activeFile) return;

		const timer = setInterval(() => {
			if (!isSaved && activeFile) {
				storageService.setSync("files", files);
				setIsSaved(true);
				setModifiedTabs(prev => prev.filter(tab => tab !== activeFileName));
				console.log("Auto-saved to storage:", activeFileName);
			}
		}, autoSaveSettings.interval * 1000);

		return () => clearInterval(timer);
	}, [autoSaveSettings, isSaved, activeFileName, files, setIsSaved, setModifiedTabs]);
}
