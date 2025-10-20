// useOutlineFilter.js
import { useMemo, useCallback } from "react";

/**
 * Hook for filtering and sorting outline
 * @param {Array} outline - Outline items
 * @returns {Object} Filter and sort functions
 */
export function useOutlineFilter(outline) {
	const filterByName = useCallback((searchTerm) => {
		if (!searchTerm) return outline;
		
		const term = searchTerm.toLowerCase();
		return outline.filter(item => 
			item.name.toLowerCase().includes(term)
		);
	}, [outline]);

	const filterByType = useCallback((type) => {
		if (!type || type === 'all') return outline;
		
		return outline.filter(item => item.type === type);
	}, [outline]);

	const sortBy = useCallback((sortKey) => {
		const sorted = [...outline];
		
		switch (sortKey) {
			case 'name':
				return sorted.sort((a, b) => a.name.localeCompare(b.name));
			case 'type':
				return sorted.sort((a, b) => a.type.localeCompare(b.type));
			case 'line':
				return sorted.sort((a, b) => a.line - b.line);
			default:
				return sorted;
		}
	}, [outline]);

	const groupByType = useCallback(() => {
		const grouped = {};
		
		outline.forEach(item => {
			if (!grouped[item.type]) {
				grouped[item.type] = [];
			}
			grouped[item.type].push(item);
		});
		
		return grouped;
	}, [outline]);

	return {
		filterByName,
		filterByType,
		sortBy,
		groupByType,
	};
}
