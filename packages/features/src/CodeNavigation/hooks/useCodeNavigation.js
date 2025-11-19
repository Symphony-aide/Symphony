// useCodeNavigation.js
import { useState, useCallback } from "react";

/**
 * Hook for code navigation functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.onNavigate - Callback when navigation occurs
 * @returns {Object} Navigation state and operations
 */
export function useCodeNavigation(options = {}) {
	const { onNavigate } = options;

	const [currentLocation, setCurrentLocation] = useState(null);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	// Navigate to a symbol
	const goToSymbol = useCallback((symbol) => {
		if (!symbol) return;

		const location = {
			type: 'symbol',
			symbol,
			line: symbol.line,
			timestamp: Date.now(),
		};

		// Add to history
		setHistory(prev => {
			const newHistory = prev.slice(0, historyIndex + 1);
			return [...newHistory, location];
		});
		setHistoryIndex(prev => prev + 1);
		setCurrentLocation(location);

		// Trigger callback
		if (onNavigate) {
			onNavigate(location);
		}
	}, [historyIndex, onNavigate]);

	// Navigate to a specific line
	const goToLine = useCallback((line) => {
		if (typeof line !== 'number') return;

		const location = {
			type: 'line',
			line,
			timestamp: Date.now(),
		};

		// Add to history
		setHistory(prev => {
			const newHistory = prev.slice(0, historyIndex + 1);
			return [...newHistory, location];
		});
		setHistoryIndex(prev => prev + 1);
		setCurrentLocation(location);

		// Trigger callback
		if (onNavigate) {
			onNavigate(location);
		}
	}, [historyIndex, onNavigate]);

	// Go back in history
	const goBack = useCallback(() => {
		if (historyIndex <= 0) return false;

		const newIndex = historyIndex - 1;
		const location = history[newIndex];

		setHistoryIndex(newIndex);
		setCurrentLocation(location);

		// Trigger callback
		if (onNavigate) {
			onNavigate(location);
		}

		return true;
	}, [history, historyIndex, onNavigate]);

	// Go forward in history
	const goForward = useCallback(() => {
		if (historyIndex >= history.length - 1) return false;

		const newIndex = historyIndex + 1;
		const location = history[newIndex];

		setHistoryIndex(newIndex);
		setCurrentLocation(location);

		// Trigger callback
		if (onNavigate) {
			onNavigate(location);
		}

		return true;
	}, [history, historyIndex, onNavigate]);

	// Clear history
	const clearHistory = useCallback(() => {
		setHistory([]);
		setHistoryIndex(-1);
		setCurrentLocation(null);
	}, []);

	// Get navigation state
	const canGoBack = historyIndex > 0;
	const canGoForward = historyIndex < history.length - 1;

	return {
		// State
		currentLocation,
		history,
		historyIndex,
		canGoBack,
		canGoForward,

		// Operations
		goToSymbol,
		goToLine,
		goBack,
		goForward,
		clearHistory,
	};
}
