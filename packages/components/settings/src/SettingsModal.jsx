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
import { Dialog, DialogContent, DialogHeader, DialogTitle, Badge, Card, Flex, Box, Heading, Text } from "ui";
import { Button } from "ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui";

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
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className='bg-gray-900 text-white w-[700px] max-w-[700px] border-gray-700'>
				<DialogHeader>
					<DialogTitle className='text-lg font-bold'>Settings</DialogTitle>
				</DialogHeader>

				{/* Scope Selector */}
				<Flex className='bg-slate-800 border-b border-slate-700'>
					<Button
						variant="ghost"
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
						<Flex direction="column">
							<Text>🌐 Global Settings</Text>
							<Text className="text-xs opacity-75 mt-1">User-wide preferences</Text>
						</Flex>
					</Button>
					<Button
						variant="ghost"
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
						<Flex direction="column">
							<Text>📁 Project Settings</Text>
							<Text className="text-xs opacity-75 mt-1">Project-specific overrides</Text>
						</Flex>
					</Button>
				</Flex>

				{/* Category Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="flex flex-row w-full bg-slate-850 border-b border-slate-700 p-1 rounded-none">
						{getSettingsCategories().map(([key, label]) => (
							<TabsTrigger
								key={key}
								value={key}
								className="flex-1 py-2 px-4 text-sm whitespace-nowrap data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 text-slate-400 hover:text-white hover:bg-slate-800"
							>
								{label}
							</TabsTrigger>
						))}
					</TabsList>

					{/* Content */}
					<Box className='p-4 max-h-[70vh] overflow-y-auto'>
						{/* Global Settings Content */}
						{activeScope === 'global' && (
							<>
								<TabsContent value="appearance" className="space-y-4">
									<Card className="bg-slate-800 p-4">
										<Heading level={3} className="text-lg font-semibold mb-3 flex items-center">
											🎨 Appearance Settings
											<Badge className="ml-2 bg-indigo-600">Global</Badge>
										</Heading>
										<EditorThemeSettings themeSettings={themeSettings} setThemeSettings={setThemeSettings} />
									</Card>
								</TabsContent>
								
								<TabsContent value="shortcuts" className="space-y-4">
									<Card className="bg-slate-800 p-4">
										<Heading level={3} className="text-lg font-semibold mb-3 flex items-center">
											⌨️ Keyboard Shortcuts
											<Badge className="ml-2 bg-indigo-600">Global</Badge>
										</Heading>
										<ShortcutSettingsModal shortcuts={shortcuts} setShortcuts={setShortcuts} onClose={() => {}} />
									</Card>
								</TabsContent>
								
								<TabsContent value="terminal" className="space-y-4">
									<Card className="bg-slate-800 p-4">
										<Heading level={3} className="text-lg font-semibold mb-3 flex items-center">
											🖥️ Terminal Settings
											<Badge className="ml-2 bg-indigo-600">Global</Badge>
										</Heading>
										<TerminalSettings
											terminalSettings={terminalSettings}
											setTerminalSettings={setTerminalSettings}
										/>
									</Card>
								</TabsContent>
							</>
						)}

						{/* Local/Project Settings Content */}
						{activeScope === 'local' && (
							<>
								<TabsContent value="editor" className="space-y-4">
									{/* Theme Override Section */}
									<Card className="bg-slate-800 p-4">
										<Heading level={3} className="text-lg font-semibold mb-3 flex items-center">
											🎨 Theme Override
											<Badge className="ml-2 bg-emerald-600">Project</Badge>
										</Heading>
										<EnhancedThemeSettings
											themeSettings={themeSettings}
											setThemeSettings={setThemeSettings}
											scope="local"
											globalThemeSettings={globalThemeSettings}
										/>
									</Card>

									{/* Editor Behavior Section */}
									<Card className="bg-slate-800 p-4">
										<Heading level={3} className="text-lg font-semibold mb-3 flex items-center">
											📝 Editor Behavior
											<Badge className="ml-2 bg-emerald-600">Project</Badge>
										</Heading>
										<Flex direction="column" gap={4}>
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
										</Flex>
									</Card>
								</TabsContent>
								
								<TabsContent value="searchreplace" className="space-y-4">
									<Card className="bg-slate-800 p-4">
										<Heading level={3} className="text-lg font-semibold mb-3 flex items-center">
											🔍 Search & Replace
											<Badge className="ml-2 bg-emerald-600">Project</Badge>
										</Heading>
										<GlobalSearchReplace onReplaceAll={onReplaceAll} />
									</Card>
								</TabsContent>
							</>
						)}
					</Box>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
