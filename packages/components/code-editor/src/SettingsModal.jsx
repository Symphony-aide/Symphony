// SettingsModal.jsx
import TabCompletionSettings from "./TabCompletionSettings";
import ShortcutSettingsModal from "./ShortcutSettingsModal";
import AutoSaveSettings from "./AutoSaveSettings";
import GlyphMarginSettings from "./GlyphMarginSettings";
import EditorThemeSettings from "./EditorThemeSettings";
import TerminalSettings from "./TerminalSettings";
import { useState } from "react";

export default function SettingsModal({
	shortcuts,
	setShortcuts,
	autoSaveSettings,
	setAutoSaveSettings,
	tabCompletionSettings,
	setTabCompletionSettings,
	glyphMarginSettings,
	setGlyphMarginSettings,
	themeSettings, // ✅ نستقبل إعدادات الثيم
	setThemeSettings, //
	terminalSettings,
	setTerminalSettings,
	onClose,
	defaultTab = "shortcuts",
}) {
	const [activeTab, setActiveTab] = useState(defaultTab);

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-gray-900 text-white w-[650px] rounded shadow-lg overflow-hidden'>
				{/* Header */}
				<div className='flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700'>
					<h2 className='text-lg font-bold'>Settings</h2>
					<button onClick={onClose} className='hover:text-red-400 text-xl'>
						✖
					</button>
				</div>

				{/* Tabs */}
				<div className='flex border-b border-gray-700 text-sm'>
					{[
						["shortcuts", "Shortcuts"],
						["autosave", "Auto Save"],
						["tabcompletion", "Tab Completion"],
						["glyphmargin", "Glyph Margin"],
						["theme", "Editor Theme"], //
						["terminal", "Terminal Settings"],
					].map(([key, label]) => (
						<button
							key={key}
							className={`flex-1 py-2 ${activeTab === key ? "bg-gray-800" : "hover:bg-gray-800"}`}
							onClick={() => setActiveTab(key)}
						>
							{label}
						</button>
					))}
				</div>

				<div className='p-4 max-h-[70vh] overflow-y-auto'>
					{activeTab === "shortcuts" && (
						<ShortcutSettingsModal shortcuts={shortcuts} setShortcuts={setShortcuts} onClose={() => {}} />
					)}
					{activeTab === "autosave" && (
						<AutoSaveSettings
							enabled={autoSaveSettings.enabled}
							interval={autoSaveSettings.interval}
							onChange={setAutoSaveSettings}
						/>
					)}
					{activeTab === "tabcompletion" && (
						<TabCompletionSettings
							enabled={tabCompletionSettings.enabled}
							onChange={setTabCompletionSettings}
						/>
					)}
					{activeTab === "glyphmargin" && (
						<GlyphMarginSettings enabled={glyphMarginSettings.enabled} onChange={setGlyphMarginSettings} />
					)}
					{activeTab === "theme" && (
						<EditorThemeSettings themeSettings={themeSettings} setThemeSettings={setThemeSettings} />
					)}
					{activeTab === "terminal" && (
						<TerminalSettings
							terminalSettings={terminalSettings}
							setTerminalSettings={setTerminalSettings}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
