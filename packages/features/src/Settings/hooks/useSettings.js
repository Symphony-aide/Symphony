// useSettings.js
import { useState, useEffect } from "react";
import { storageService } from "../services/storageService";

/**
 * Default settings values
 */
const DEFAULT_SETTINGS = {
	autoSave: { enabled: false, interval: 2 },
	tabCompletion: { enabled: true },
	glyphMargin: { enabled: true },
	theme: { theme: "vs-dark", fontSize: 14, fontFamily: "Fira Code, monospace" },
	terminal: {
		fontFamily: "Fira Code, monospace",
		fontSize: 14,
		fontWeight: "normal",
		lineHeight: 1.2,
		cursorStyle: "block",
	},
	shortcuts: [
		{ operation: "save", shortcut: "ctrl+s" },
		{ operation: "run", shortcut: "ctrl+r" },
		{ operation: "format", shortcut: "ctrl+f" },
		{ operation: "toggleTerminal", shortcut: "ctrl+`" },
	],
};

/**
 * Manages all editor settings with persistence
 */
export function useSettings() {
	// Auto-save settings
	const [autoSaveSettings, setAutoSaveSettings] = useState(() => {
		const saved = storageService.getSync("autoSaveSettings");
		return saved || DEFAULT_SETTINGS.autoSave;
	});

	// Tab completion settings
	const [tabCompletionSettings, setTabCompletionSettings] = useState(() => {
		const saved = storageService.getSync("tabCompletionSettings");
		return saved || DEFAULT_SETTINGS.tabCompletion;
	});

	// Glyph margin settings
	const [glyphMarginSettings, setGlyphMarginSettings] = useState(() => {
		const saved = storageService.getSync("glyphMarginSettings");
		return saved || DEFAULT_SETTINGS.glyphMargin;
	});

	// Theme settings
	const [themeSettings, setThemeSettings] = useState(() => {
		const saved = storageService.getSync("themeSettings");
		return saved || DEFAULT_SETTINGS.theme;
	});

	// Terminal settings
	const [terminalSettings, setTerminalSettings] = useState(() => {
		const saved = storageService.getSync("terminalSettings");
		return saved || DEFAULT_SETTINGS.terminal;
	});

	// Shortcuts
	const [shortcuts, setShortcuts] = useState(() => {
		try {
			const saved = storageService.getSync("shortcuts");
			if (Array.isArray(saved)) return saved;
		} catch {}
		return DEFAULT_SETTINGS.shortcuts;
	});

	// Settings modal state
	const [showSettings, setShowSettings] = useState(false);
	const [settingsTab, setSettingsTab] = useState("shortcuts");

	// Persist settings to storage
	useEffect(() => {
		storageService.setSync("autoSaveSettings", autoSaveSettings);
	}, [autoSaveSettings]);

	useEffect(() => {
		storageService.setSync("tabCompletionSettings", tabCompletionSettings);
	}, [tabCompletionSettings]);

	useEffect(() => {
		storageService.setSync("glyphMarginSettings", glyphMarginSettings);
	}, [glyphMarginSettings]);

	useEffect(() => {
		storageService.setSync("themeSettings", themeSettings);
	}, [themeSettings]);

	useEffect(() => {
		storageService.setSync("terminalSettings", terminalSettings);
	}, [terminalSettings]);

	useEffect(() => {
		storageService.setSync("shortcuts", shortcuts);
	}, [shortcuts]);

	// Utility functions
	const resetSettings = () => {
		setAutoSaveSettings(DEFAULT_SETTINGS.autoSave);
		setTabCompletionSettings(DEFAULT_SETTINGS.tabCompletion);
		setGlyphMarginSettings(DEFAULT_SETTINGS.glyphMargin);
		setThemeSettings(DEFAULT_SETTINGS.theme);
		setTerminalSettings(DEFAULT_SETTINGS.terminal);
		setShortcuts(DEFAULT_SETTINGS.shortcuts);
	};

	const openSettings = (tab = "shortcuts") => {
		setSettingsTab(tab);
		setShowSettings(true);
	};

	const closeSettings = () => {
		setShowSettings(false);
	};

	return {
		// Settings state
		autoSaveSettings,
		setAutoSaveSettings,
		tabCompletionSettings,
		setTabCompletionSettings,
		glyphMarginSettings,
		setGlyphMarginSettings,
		themeSettings,
		setThemeSettings,
		terminalSettings,
		setTerminalSettings,
		shortcuts,
		setShortcuts,
		
		// Modal state
		showSettings,
		setShowSettings,
		settingsTab,
		setSettingsTab,

		// Utility functions
		resetSettings,
		openSettings,
		closeSettings,
	};
}
