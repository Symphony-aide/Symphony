// useFileSearch.js
import { useState, useMemo, useCallback } from "react";

/**
 * Provides file search functionality
 * @param {Array} files - Array of file objects
 * @returns {Object} Search state and functions
 */
export function useFileSearch(files = []) {
	const [searchTerm, setSearchTerm] = useState("");

	// Search results
	const results = useMemo(() => {
		if (!searchTerm) return files;

		const term = searchTerm.toLowerCase();
		return files.filter(file => 
			file.name.toLowerCase().includes(term) ||
			file.content?.toLowerCase().includes(term)
		);
	}, [files, searchTerm]);

	// Search by name only
	const searchByName = useMemo(() => {
		if (!searchTerm) return files;

		const term = searchTerm.toLowerCase();
		return files.filter(file => 
			file.name.toLowerCase().includes(term)
		);
	}, [files, searchTerm]);

	// Search by content only
	const searchByContent = useMemo(() => {
		if (!searchTerm) return [];

		const term = searchTerm.toLowerCase();
		return files.filter(file => 
			file.content?.toLowerCase().includes(term)
		);
	}, [files, searchTerm]);

	// Clear search
	const clearSearch = useCallback(() => {
		setSearchTerm("");
	}, []);

	// Check if file matches search
	const matchesSearch = useCallback((file) => {
		if (!searchTerm) return true;
		
		const term = searchTerm.toLowerCase();
		return file.name.toLowerCase().includes(term) ||
		       file.content?.toLowerCase().includes(term);
	}, [searchTerm]);

	return {
		searchTerm,
		setSearchTerm,
		results,
		searchByName,
		searchByContent,
		clearSearch,
		matchesSearch,
		hasResults: results.length > 0,
		resultCount: results.length,
	};
}
