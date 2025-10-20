// FileTreeFeature.jsx
import React, { useMemo } from "react";
import { useTreeBuilder } from "./hooks/useTreeBuilder";
import { useTreeFilter } from "./hooks/useTreeFilter";
import { useTreeSort } from "./hooks/useTreeSort";
import { getFileStatus, getStatusBadge } from "./utils/statusHelpers";

/**
 * FileTree Feature Component
 * Manages file tree building, filtering, and sorting
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving file tree API
 * @param {Array} props.files - Array of file objects
 * @param {Array} props.userFolders - Array of user-created folder paths
 * @param {Array} props.modifiedTabs - Array of modified file names
 * @param {Object} props.gitStatusMap - Map of file names to git statuses
 * @returns {React.Element}
 */
export function FileTreeFeature({ 
	children, 
	files = [],
	userFolders = [],
	modifiedTabs = [],
	gitStatusMap = {}
}) {
	// Build tree structure
	const tree = useTreeBuilder(files, userFolders);

	// Get filter functions
	const {
		filterTree,
		getAllExtensions,
		getAllStatuses,
		getExt,
		getSizeKB,
		matchSize,
	} = useTreeFilter();

	// Get sort functions
	const {
		sortChildren,
		getVisibleFilesFlat,
	} = useTreeSort();

	// Get all extensions and statuses
	const allExtensions = useMemo(() => 
		getAllExtensions(files), 
		[files, getAllExtensions]
	);

	const allStatuses = useMemo(() => 
		getAllStatuses(files, modifiedTabs, gitStatusMap), 
		[files, modifiedTabs, gitStatusMap, getAllStatuses]
	);

	// Expose clean API to consumers
	const api = {
		// Tree structure
		tree,

		// Filter functions
		filterTree: (extFilter, sizeFilter, statusFilter, searchTerm) => 
			filterTree(tree, extFilter, sizeFilter, statusFilter, searchTerm, modifiedTabs, gitStatusMap),
		
		// Sort functions
		sortChildren,
		getVisibleFilesFlat: (extFilter, sizeFilter, statusFilter, sortBy, searchTerm) =>
			getVisibleFilesFlat(files, extFilter, sizeFilter, statusFilter, sortBy, searchTerm, modifiedTabs, gitStatusMap, getExt, getSizeKB, matchSize),

		// Helper functions
		getExt,
		getSizeKB,
		getStatus: (file) => getFileStatus(file, modifiedTabs, gitStatusMap),
		statusBadge: getStatusBadge,

		// Metadata
		allExtensions,
		allStatuses,
	};

	return children(api);
}

/**
 * Hook version of FileTree feature
 * Use this when you don't need the render prop pattern
 */
export function useFileTree(options = {}) {
	const {
		files = [],
		userFolders = [],
		modifiedTabs = [],
		gitStatusMap = {}
	} = options;

	// Build tree structure
	const tree = useTreeBuilder(files, userFolders);

	// Get filter functions
	const {
		filterTree,
		getAllExtensions,
		getAllStatuses,
		getExt,
		getSizeKB,
		matchSize,
	} = useTreeFilter();

	// Get sort functions
	const {
		sortChildren,
		getVisibleFilesFlat,
	} = useTreeSort();

	// Get all extensions and statuses
	const allExtensions = useMemo(() => 
		getAllExtensions(files), 
		[files, getAllExtensions]
	);

	const allStatuses = useMemo(() => 
		getAllStatuses(files, modifiedTabs, gitStatusMap), 
		[files, modifiedTabs, gitStatusMap, getAllStatuses]
	);

	return {
		// Tree structure
		tree,

		// Filter functions
		filterTree: (extFilter, sizeFilter, statusFilter, searchTerm) => 
			filterTree(tree, extFilter, sizeFilter, statusFilter, searchTerm, modifiedTabs, gitStatusMap),
		
		// Sort functions
		sortChildren,
		getVisibleFilesFlat: (extFilter, sizeFilter, statusFilter, sortBy, searchTerm) =>
			getVisibleFilesFlat(files, extFilter, sizeFilter, statusFilter, sortBy, searchTerm, modifiedTabs, gitStatusMap, getExt, getSizeKB, matchSize),

		// Helper functions
		getExt,
		getSizeKB,
		getStatus: (file) => getFileStatus(file, modifiedTabs, gitStatusMap),
		statusBadge: getStatusBadge,

		// Metadata
		allExtensions,
		allStatuses,
	};
}
