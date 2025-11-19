// FolderManagementFeature.jsx
import React from "react";
import { useFolderState } from "./hooks/useFolderState";
import { useFolderOperations } from "./hooks/useFolderOperations";

/**
 * FolderManagement Feature Component
 * Manages folder state and operations for file explorer
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving folder management API
 * @param {Array} props.files - Files array for folder operations
 * @param {Function} props.onRenameFile - Callback when file is renamed
 * @param {Function} props.onDeleteFile - Callback when file is deleted
 * @returns {React.Element}
 */
export function FolderManagementFeature({ 
	children, 
	files = [],
	onRenameFile,
	onDeleteFile 
}) {
	// Get folder state
	const folderState = useFolderState();

	// Get folder operations
	const folderOperations = useFolderOperations({
		...folderState,
		files,
		onRenameFile,
		onDeleteFile,
	});

	// Expose clean API to consumers
	const api = {
		// State
		userFolders: folderState.userFolders,
		expanded: folderState.expanded,

		// Operations
		toggleExpand: folderOperations.toggleExpand,
		createFolder: folderOperations.createFolder,
		renameFolder: folderOperations.renameFolder,
		deleteFolder: folderOperations.deleteFolder,
		expandFolder: folderOperations.expandFolder,
		collapseFolder: folderOperations.collapseFolder,
		expandAll: folderOperations.expandAll,
		collapseAll: folderOperations.collapseAll,

		// State setters (for advanced use cases)
		setExpanded: folderState.setExpanded,
		setUserFolders: folderState.setUserFolders,
	};

	return children(api);
}

/**
 * Hook version of FolderManagement feature
 * Use this when you don't need the render prop pattern
 */
export function useFolderManagement(options = {}) {
	const folderState = useFolderState();
	const folderOperations = useFolderOperations({
		...folderState,
		files: options.files || [],
		onRenameFile: options.onRenameFile,
		onDeleteFile: options.onDeleteFile,
	});

	return {
		// State
		userFolders: folderState.userFolders,
		expanded: folderState.expanded,

		// Operations
		toggleExpand: folderOperations.toggleExpand,
		createFolder: folderOperations.createFolder,
		renameFolder: folderOperations.renameFolder,
		deleteFolder: folderOperations.deleteFolder,
		expandFolder: folderOperations.expandFolder,
		collapseFolder: folderOperations.collapseFolder,
		expandAll: folderOperations.expandAll,
		collapseAll: folderOperations.collapseAll,

		// State setters
		setExpanded: folderState.setExpanded,
		setUserFolders: folderState.setUserFolders,
	};
}
