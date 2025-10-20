// symbolTypes.js
/**
 * Symbol type definitions and utilities
 */

export const SYMBOL_TYPES = {
	FUNCTION: 'function',
	CLASS: 'class',
	METHOD: 'method',
	VARIABLE: 'variable',
	CONSTANT: 'constant',
	INTERFACE: 'interface',
	TYPE: 'type',
	ENUM: 'enum',
};

export const SYMBOL_ICONS = {
	[SYMBOL_TYPES.FUNCTION]: '𝑓',
	[SYMBOL_TYPES.CLASS]: 'C',
	[SYMBOL_TYPES.METHOD]: 'M',
	[SYMBOL_TYPES.VARIABLE]: 'V',
	[SYMBOL_TYPES.CONSTANT]: 'K',
	[SYMBOL_TYPES.INTERFACE]: 'I',
	[SYMBOL_TYPES.TYPE]: 'T',
	[SYMBOL_TYPES.ENUM]: 'E',
};

export const SYMBOL_COLORS = {
	[SYMBOL_TYPES.FUNCTION]: 'text-yellow-400',
	[SYMBOL_TYPES.CLASS]: 'text-blue-400',
	[SYMBOL_TYPES.METHOD]: 'text-purple-400',
	[SYMBOL_TYPES.VARIABLE]: 'text-green-400',
	[SYMBOL_TYPES.CONSTANT]: 'text-orange-400',
	[SYMBOL_TYPES.INTERFACE]: 'text-cyan-400',
	[SYMBOL_TYPES.TYPE]: 'text-pink-400',
	[SYMBOL_TYPES.ENUM]: 'text-red-400',
};

/**
 * Get icon for symbol type
 */
export function getSymbolIcon(type) {
	return SYMBOL_ICONS[type] || '?';
}

/**
 * Get color for symbol type
 */
export function getSymbolColor(type) {
	return SYMBOL_COLORS[type] || 'text-gray-400';
}

/**
 * Get display name for symbol type
 */
export function getSymbolDisplayName(type) {
	return type.charAt(0).toUpperCase() + type.slice(1);
}
