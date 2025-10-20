// OutlineTreeFeature.jsx
import React from "react";
import { useOutlineTree } from "./hooks/useOutlineTree";

/**
 * OutlineTree Feature Component
 * Manages code outline parsing and tree structure
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving outline API
 * @param {string} props.code - Code to parse
 * @param {string} props.language - Programming language
 * @param {string} props.searchTerm - Search filter
 * @param {string} props.typeFilter - Type filter
 * @param {string} props.sortBy - Sort key
 * @returns {React.Element}
 */
export function OutlineTreeFeature({ 
	children, 
	code,
	language = 'javascript',
	searchTerm = '',
	typeFilter = 'all',
	sortBy = 'line'
}) {
	const outlineTree = useOutlineTree({
		code,
		language,
		searchTerm,
		typeFilter,
		sortBy,
	});

	// Expose clean API to consumers
	const api = {
		// State
		outline: outlineTree.outline,
		rawOutline: outlineTree.rawOutline,
		isLoading: outlineTree.isLoading,
		error: outlineTree.error,
		availableTypes: outlineTree.availableTypes,
		groupedOutline: outlineTree.groupedOutline,

		// Operations
		parse: outlineTree.parse,
		getSymbolAtLine: outlineTree.getSymbolAtLine,
		getSymbolsByType: outlineTree.getSymbolsByType,
		clear: outlineTree.clear,
	};

	return children(api);
}

/**
 * Hook version of OutlineTree feature
 * Use this when you don't need the render prop pattern
 */
export { useOutlineTree } from "./hooks/useOutlineTree";
export { useOutlineParser } from "./hooks/useOutlineParser";
export { useOutlineFilter } from "./hooks/useOutlineFilter";
