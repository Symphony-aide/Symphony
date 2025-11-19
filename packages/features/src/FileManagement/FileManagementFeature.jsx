// FileManagementFeature.jsx
import React from "react";
import { useFileState } from "./hooks/useFileState";
import { useFileOperations } from "./hooks/useFileOperations";

/**
 * FileManagement Feature Component
 * Manages file state and operations, exposing a clean API to consumers
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving file management API
 * @param {Function} props.onFileChange - Callback when file content changes
 * @returns {React.Element}
 */
export function FileManagementFeature({ children, onFileChange }) {
	// Get file state
	const fileState = useFileState();

	// Get file operations with state handlers
	const fileOperations = useFileOperations({
		...fileState,
		onFileChange,
	});

	// Expose clean API to consumers
	const api = {
		// State
		files: fileState.files,
		activeFile: fileState.activeFile,
		activeFileName: fileState.activeFileName,
		openTabs: fileState.openTabs,
		modifiedTabs: fileState.modifiedTabs,
		isSaved: fileState.isSaved,

		// Operations
		selectFile: fileOperations.selectFile,
		createFile: fileOperations.createFile,
		uploadFile: fileOperations.uploadFile,
		deleteFile: fileOperations.deleteFile,
		renameFile: fileOperations.renameFile,
		downloadFile: fileOperations.downloadFile,
		closeTab: fileOperations.closeTab,
		updateFileContent: fileOperations.updateFileContent,

		// State setters (for advanced use cases)
		setActiveFileName: fileState.setActiveFileName,
		setIsSaved: fileState.setIsSaved,
		setModifiedTabs: fileState.setModifiedTabs,
	};

	return children(api);
}

/**
 * Hook version of FileManagement feature
 * Use this when you don't need the render prop pattern
 */
export function useFileManagement(options = {}) {
	const fileState = useFileState();
	const fileOperations = useFileOperations({
		...fileState,
		onFileChange: options.onFileChange,
	});

	return {
		// State
		files: fileState.files,
		activeFile: fileState.activeFile,
		activeFileName: fileState.activeFileName,
		openTabs: fileState.openTabs,
		modifiedTabs: fileState.modifiedTabs,
		isSaved: fileState.isSaved,

		// Operations
		selectFile: fileOperations.selectFile,
		createFile: fileOperations.createFile,
		uploadFile: fileOperations.uploadFile,
		deleteFile: fileOperations.deleteFile,
		renameFile: fileOperations.renameFile,
		downloadFile: fileOperations.downloadFile,
		closeTab: fileOperations.closeTab,
		updateFileContent: fileOperations.updateFileContent,

		// State setters
		setActiveFileName: fileState.setActiveFileName,
		setIsSaved: fileState.setIsSaved,
		setModifiedTabs: fileState.setModifiedTabs,
	};
}
