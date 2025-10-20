// CodeNavigationFeature.jsx
import React from "react";
import { useCodeNavigation } from "./hooks/useCodeNavigation";

/**
 * CodeNavigation Feature Component
 * Manages code navigation and history
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving navigation API
 * @param {Function} props.onNavigate - Callback when navigation occurs
 * @returns {React.Element}
 */
export function CodeNavigationFeature({ children, onNavigate }) {
	const navigation = useCodeNavigation({ onNavigate });

	// Expose clean API to consumers
	const api = {
		// State
		currentLocation: navigation.currentLocation,
		history: navigation.history,
		historyIndex: navigation.historyIndex,
		canGoBack: navigation.canGoBack,
		canGoForward: navigation.canGoForward,

		// Operations
		goToSymbol: navigation.goToSymbol,
		goToLine: navigation.goToLine,
		goBack: navigation.goBack,
		goForward: navigation.goForward,
		clearHistory: navigation.clearHistory,
	};

	return children(api);
}

/**
 * Hook version of CodeNavigation feature
 * Use this when you don't need the render prop pattern
 */
export { useCodeNavigation } from "./hooks/useCodeNavigation";
