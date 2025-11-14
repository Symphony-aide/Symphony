// useEditorSettings.js
import { useState, useEffect } from "react";
import { storageService } from "../utils/storageService.js";

export function useEditorSettings() {
	// Auto-save settings
	const [autoSaveSettings, setAutoSaveSettings] = useState(() => {
		const saved = storageService.getSync("autoSaveSettings");
		return saved || { enabled: false, interval: 2 };
	});

	// Tab completion settings
	const [tabCompletionSettings, setTabCompletionSettings] = useState(() => {
		const saved = storageService.getSync("tabCompletionSettings");
		return saved || { enabled: true };
	});

	// Glyph margin settings
	const [glyphMarginSettings, setGlyphMarginSettings] = useState(() => {
		const saved = storageService.getSync("glyphMarginSettings");
		return saved || { enabled: true };
	});

	// Theme settings
	const [themeSettings, setThemeSettings] = useState(() => {
		const saved = storageService.getSync("themeSettings");
		return saved || { theme: "vs-dark", fontSize: 14, fontFamily: "Fira Code, monospace" };
	});

	// Terminal settings
	const [terminalSettings, setTerminalSettings] = useState(() => {
		const saved = storageService.getSync("terminalSettings");
		return saved || {
				fontFamily: "Fira Code, monospace",
				fontSize: 14,
				fontWeight: "normal",
				lineHeight: 1.2,
				cursorStyle: "block",
			};
	});

	// Shortcuts
	const [shortcuts, setShortcuts] = useState(() => {
		try {
			const saved = storageService.getSync("shortcuts");
			if (Array.isArray(saved)) return saved;
		} catch { /* empty */ }
		return [
			{ operation: "save", shortcut: "ctrl+s" },
			{ operation: "run", shortcut: "ctrl+r" },
			{ operation: "format", shortcut: "ctrl+f" },
			{ operation: "toggleTerminal", shortcut: "ctrl+`" },
		];
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

	return {
		// Settings
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
	};
}
