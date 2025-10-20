// useOutlineTree.js
import { useState, useEffect, useMemo } from "react";
import { useOutlineParser } from "./useOutlineParser";
import { useOutlineFilter } from "./useOutlineFilter";

/**
 * Main hook for outline tree management
 * @param {Object} options - Configuration options
 * @param {string} options.code - Code to parse
 * @param {string} options.language - Programming language
 * @param {string} options.searchTerm - Search filter
 * @param {string} options.typeFilter - Type filter
 * @param {string} options.sortBy - Sort key
 * @returns {Object} Outline tree state and operations
 */
export function useOutlineTree(options = {}) {
	const {
		code = '',
		language = 'javascript',
		searchTerm = '',
		typeFilter = 'all',
		sortBy: sortKey = 'line',
	} = options;

	const [outline, setOutline] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const parser = useOutlineParser();
	const filter = useOutlineFilter(outline);

	// Parse code when it changes
	useEffect(() => {
		if (!code) {
			setOutline([]);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const parsed = parser.parse(code, language);
			setOutline(parsed);
		} catch (err) {
			setError(err.message);
			setOutline([]);
		} finally {
			setIsLoading(false);
		}
	}, [code, language, parser]);

	// Apply filters and sorting
	const filteredOutline = useMemo(() => {
		let result = outline;

		// Apply type filter
		if (typeFilter && typeFilter !== 'all') {
			result = filter.filterByType(typeFilter);
		}

		// Apply search filter
		if (searchTerm) {
			result = result.filter(item => 
				item.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Apply sorting
		if (sortKey) {
			result = filter.sortBy(sortKey);
		}

		return result;
	}, [outline, typeFilter, searchTerm, sortKey, filter]);

	// Get all available types
	const availableTypes = useMemo(() => {
		return parser.getAllTypes(outline);
	}, [outline, parser]);

	// Group by type
	const groupedOutline = useMemo(() => {
		return filter.groupByType();
	}, [filter]);

	return {
		// State
		outline: filteredOutline,
		rawOutline: outline,
		isLoading,
		error,
		availableTypes,
		groupedOutline,

		// Operations
		parse: (newCode, newLanguage) => {
			const parsed = parser.parse(newCode, newLanguage || language);
			setOutline(parsed);
		},
		getSymbolAtLine: (line) => parser.getSymbolAtLine(outline, line),
		getSymbolsByType: (type) => parser.getSymbolsByType(outline, type),
		clear: () => setOutline([]),
	};
}
