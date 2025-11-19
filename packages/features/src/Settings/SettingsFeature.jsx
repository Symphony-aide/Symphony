// SettingsFeature.jsx
import React from "react";
import { useSettings } from "./hooks/useSettings";

/**
 * Settings Feature Component
 * Manages all editor settings including theme, shortcuts, terminal, etc.
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving settings API
 * @returns {React.Element}
 */
export function SettingsFeature({ children }) {
	const settings = useSettings();

	// Expose clean API to consumers
	const api = {
		// Settings state
		autoSave: settings.autoSaveSettings,
		setAutoSave: settings.setAutoSaveSettings,
		
		tabCompletion: settings.tabCompletionSettings,
		setTabCompletion: settings.setTabCompletionSettings,
		
		glyphMargin: settings.glyphMarginSettings,
		setGlyphMargin: settings.setGlyphMarginSettings,
		
		theme: settings.themeSettings,
		setTheme: settings.setThemeSettings,
		
		terminal: settings.terminalSettings,
		setTerminal: settings.setTerminalSettings,
		
		shortcuts: settings.shortcuts,
		setShortcuts: settings.setShortcuts,

		// Modal state
		isSettingsOpen: settings.showSettings,
		activeTab: settings.settingsTab,

		// Actions
		openSettings: settings.openSettings,
		closeSettings: settings.closeSettings,
		resetSettings: settings.resetSettings,
	};

	return children(api);
}

/**
 * Hook version of Settings feature
 * Use this when you don't need the render prop pattern
 */
export function useSettingsFeature() {
	const settings = useSettings();

	return {
		// Settings state
		autoSave: settings.autoSaveSettings,
		setAutoSave: settings.setAutoSaveSettings,
		
		tabCompletion: settings.tabCompletionSettings,
		setTabCompletion: settings.setTabCompletionSettings,
		
		glyphMargin: settings.glyphMarginSettings,
		setGlyphMargin: settings.setGlyphMarginSettings,
		
		theme: settings.themeSettings,
		setTheme: settings.setThemeSettings,
		
		terminal: settings.terminalSettings,
		setTerminal: settings.setTerminalSettings,
		
		shortcuts: settings.shortcuts,
		setShortcuts: settings.setShortcuts,

		// Modal state
		isSettingsOpen: settings.showSettings,
		activeTab: settings.settingsTab,

		// Actions
		openSettings: settings.openSettings,
		closeSettings: settings.closeSettings,
		resetSettings: settings.resetSettings,
	};
}
