// SettingsPanel.jsx
import React from "react";
import SettingsModal from "../../../settings/src/SettingsModal";

export default function SettingsPanel({
	showSettings,
	onClose,
	shortcuts,
	setShortcuts,
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
	settingsTab,
	onReplaceAll,
}) {
	if (!showSettings) return null;

	return (
		<SettingsModal
			shortcuts={shortcuts}
			setShortcuts={setShortcuts}
			autoSaveSettings={autoSaveSettings}
			setAutoSaveSettings={setAutoSaveSettings}
			tabCompletionSettings={tabCompletionSettings}
			setTabCompletionSettings={setTabCompletionSettings}
			glyphMarginSettings={glyphMarginSettings}
			setGlyphMarginSettings={setGlyphMarginSettings}
			themeSettings={themeSettings}
			setThemeSettings={setThemeSettings}
			terminalSettings={terminalSettings}
			setTerminalSettings={setTerminalSettings}
			onClose={onClose}
			defaultTab={settingsTab}
			onReplaceAll={onReplaceAll}
		/>
	);
}
