// FileSearchFeature.jsx
import React from "react";
import { useFileSearch } from "./hooks/useFileSearch";

/**
 * FileSearch Feature Component
 * Provides file search functionality
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving search API
 * @param {Array} props.files - Array of file objects to search
 * @returns {React.Element}
 */
export function FileSearchFeature({ children, files = [] }) {
	const search = useFileSearch(files);

	// Expose clean API to consumers
	const api = {
		// Search state
		searchTerm: search.searchTerm,
		setSearchTerm: search.setSearchTerm,

		// Results
		results: search.results,
		searchByName: search.searchByName,
		searchByContent: search.searchByContent,
		hasResults: search.hasResults,
		resultCount: search.resultCount,

		// Actions
		clearSearch: search.clearSearch,
		matchesSearch: search.matchesSearch,
	};

	return children(api);
}

/**
 * Hook version of FileSearch feature
 * Use this when you don't need the render prop pattern
 */
export { useFileSearch } from "./hooks/useFileSearch";
