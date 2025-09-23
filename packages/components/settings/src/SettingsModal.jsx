// SettingsModal.jsx
import TabCompletionSettings from "./TabCompletionSettings";
import ShortcutSettingsModal from "./ShortcutSettingsModal";
import AutoSaveSettings from "./AutoSaveSettings";
import GlyphMarginSettings from "./GlyphMarginSettings";
import EditorThemeSettings from "./EditorThemeSettings";
import EnhancedThemeSettings from "./EnhancedThemeSettings";
import TerminalSettings from "./TerminalSettings";
import GlobalSearchReplace from "./GlobalSearchReplace";
import ProjectSettingsStatus from "./ProjectSettingsStatus";
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
	themeSettings,
	setThemeSettings,
	terminalSettings,
	setTerminalSettings,
	onClose,
	defaultScope = "global",
	defaultTab = "appearance",
	onReplaceAll,
	// Project settings props
	hasProjectSettings = false,
	projectPath = null,
	globalThemeSettings = null,
	onCreateProject = () => {},
	onExportSettings = () => {},
	onImportSettings = () => {},
}) {
	const [activeScope, setActiveScope] = useState(defaultScope); // 'global' or 'local'
	const [activeTab, setActiveTab] = useState(defaultTab);

	// Define settings categories based on scope
	const getSettingsCategories = () => {
		if (activeScope === 'global') {
			return [
				["appearance", "🎨 Appearance"],
				["shortcuts", "⌨️ Shortcuts"],
				["terminal", "🖥️ Terminal"],
			];
		} else {
			return [
				["editor", "📝 Editor"],
				["searchreplace", "🔍 Search & Replace"],
			];
		}
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-gray-900 text-white w-[700px] rounded shadow-lg overflow-hidden'>
				{/* Header */}
				<div className='flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700'>
					<h2 className='text-lg font-bold'>Settings</h2>
					<button onClick={onClose} className='hover:text-red-400 text-xl'>
						✖
					</button>
				</div>

				{/* Scope Selector */}
				<div className='flex bg-gray-800 border-b border-gray-700'>
					<button
						className={`flex-1 py-3 px-4 font-medium transition-colors ${
							activeScope === 'global' 
								? 'bg-blue-600 text-white border-b-2 border-blue-400' 
								: 'text-gray-300 hover:text-white hover:bg-gray-700'
						}`}
						onClick={() => {
							setActiveScope('global');
							setActiveTab('appearance');
						}}
					>
						🌐 Global Settings
						<div className="text-xs opacity-75 mt-1">User-wide preferences</div>
					</button>
					<button
						className={`flex-1 py-3 px-4 font-medium transition-colors ${
							activeScope === 'local' 
								? 'bg-blue-600 text-white border-b-2 border-blue-400' 
								: 'text-gray-300 hover:text-white hover:bg-gray-700'
						}`}
						onClick={() => {
							setActiveScope('local');
							setActiveTab('editor');
						}}
					>
						📁 Project Settings
						<div className="text-xs opacity-75 mt-1">Project-specific overrides</div>
					</button>
				</div>

				{/* Category Tabs */}
				<div className='flex border-b border-gray-700 text-sm bg-gray-850'>
					{getSettingsCategories().map(([key, label]) => (
						<button
							key={key}
							className={`flex-1 py-2 px-3 transition-colors ${
								activeTab === key 
									? "bg-gray-700 text-white border-b-2 border-blue-500" 
									: "text-gray-400 hover:text-white hover:bg-gray-800"
							}`}
							onClick={() => setActiveTab(key)}
						>
							{label}
						</button>
					))}
				</div>

				{/* Content */}
				<div className='p-4 max-h-[70vh] overflow-y-auto'>

					{/* Global Settings Content */}
					{activeScope === 'global' && (
						<>
							{activeTab === "appearance" && (
								<div className="space-y-4">
									<div className="bg-gray-800 p-4 rounded-lg">
										<h3 className="text-lg font-semibold mb-3 flex items-center">
											🎨 Appearance Settings
											<span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">Global</span>
										</h3>
										<EditorThemeSettings themeSettings={themeSettings} setThemeSettings={setThemeSettings} />
									</div>
								</div>
							)}
							
							{activeTab === "shortcuts" && (
								<div className="space-y-4">
									<div className="bg-gray-800 p-4 rounded-lg">
										<h3 className="text-lg font-semibold mb-3 flex items-center">
											⌨️ Keyboard Shortcuts
											<span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">Global</span>
										</h3>
										<ShortcutSettingsModal shortcuts={shortcuts} setShortcuts={setShortcuts} onClose={() => {}} />
									</div>
								</div>
							)}
							
							{activeTab === "terminal" && (
								<div className="space-y-4">
									<div className="bg-gray-800 p-4 rounded-lg">
										<h3 className="text-lg font-semibold mb-3 flex items-center">
											🖥️ Terminal Settings
											<span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">Global</span>
										</h3>
										<TerminalSettings
											terminalSettings={terminalSettings}
											setTerminalSettings={setTerminalSettings}
										/>
									</div>
								</div>
							)}
							
						</>
					)}

					{/* Local/Project Settings Content */}
					{activeScope === 'local' && (
						<>
							{activeTab === "editor" && (
								<div className="space-y-4">
									{/* Theme Override Section */}
									<div className="bg-gray-800 p-4 rounded-lg">
										<h3 className="text-lg font-semibold mb-3 flex items-center">
											🎨 Theme Override
											<span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">Project</span>
										</h3>
										<EnhancedThemeSettings
											themeSettings={themeSettings}
											setThemeSettings={setThemeSettings}
											scope="local"
											globalThemeSettings={globalThemeSettings}
										/>
									</div>

									{/* Editor Behavior Section */}
									<div className="bg-gray-800 p-4 rounded-lg">
										<h3 className="text-lg font-semibold mb-3 flex items-center">
											📝 Editor Behavior
											<span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">Project</span>
										</h3>
										<div className="space-y-4">
											<AutoSaveSettings
												enabled={autoSaveSettings.enabled}
												interval={autoSaveSettings.interval}
												onChange={setAutoSaveSettings}
											/>
											<TabCompletionSettings
												enabled={tabCompletionSettings.enabled}
												onChange={setTabCompletionSettings}
											/>
											<GlyphMarginSettings 
												enabled={glyphMarginSettings.enabled} 
												onChange={setGlyphMarginSettings} 
											/>
										</div>
									</div>
								</div>
							)}
							
							
							{activeTab === "searchreplace" && (
								<div className="space-y-4">
									<div className="bg-gray-800 p-4 rounded-lg">
										<h3 className="text-lg font-semibold mb-3 flex items-center">
											🔍 Search & Replace
											<span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">Project</span>
										</h3>
										<GlobalSearchReplace onReplaceAll={onReplaceAll} />
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
