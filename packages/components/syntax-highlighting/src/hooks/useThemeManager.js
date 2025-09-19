// useThemeManager.js
import { useMemo } from "react";
import { getTheme, parseThemeColors } from "../utils/themeParser";

export function useThemeManager(themeName = "dark") {
	return useMemo(() => {
		const theme = getTheme(themeName);
		const colors = parseThemeColors(theme);
		
		return {
			...colors,
			getTokenColor: (scopes) => {
				// Find the most specific color for the given scopes
				for (const scope of scopes) {
					if (colors.tokenColors[scope]) {
						return colors.tokenColors[scope];
					}
					
					// Try partial matches (e.g., 'keyword' matches 'keyword.control')
					const partialMatch = Object.keys(colors.tokenColors).find(key => 
						scope.startsWith(key) || key.startsWith(scope)
					);
					
					if (partialMatch) {
						return colors.tokenColors[partialMatch];
					}
				}
				
				// Return default foreground color
				return colors.foreground;
			}
		};
	}, [themeName]);
}
