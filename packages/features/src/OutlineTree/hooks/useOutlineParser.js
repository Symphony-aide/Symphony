// useOutlineParser.js
import { useCallback } from "react";
import { parseCode } from "../services/OutlineParser";

/**
 * Hook for parsing code to extract outline
 * @returns {Object} Parser functions
 */
export function useOutlineParser() {
	const parse = useCallback((code, language = 'javascript') => {
		try {
			return parseCode(code, language);
		} catch (error) {
			console.error("Failed to parse code:", error);
			return [];
		}
	}, []);

	const getSymbolAtLine = useCallback((outline, lineNumber) => {
		return outline.find(item => item.line === lineNumber);
	}, []);

	const getSymbolsByType = useCallback((outline, type) => {
		return outline.filter(item => item.type === type);
	}, []);

	const getAllTypes = useCallback((outline) => {
		const types = new Set();
		outline.forEach(item => types.add(item.type));
		return Array.from(types).sort();
	}, []);

	return {
		parse,
		getSymbolAtLine,
		getSymbolsByType,
		getAllTypes,
	};
}
