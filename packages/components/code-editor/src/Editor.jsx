// Editor.jsx
import React from "react";
import { FilesProvider } from "./FilesProvider";
import LayoutManager from "./components/LayoutManager";
import { createLayoutFactory } from "./components/LayoutFactory";
import SettingsPanel from "./components/SettingsPanel";
import StatusBar from "../../statusbar/src/StatusBar";
import { UndoRedoToolbar } from "@symphony/commands";
import { useEditorState } from "./hooks/useEditorState";
import { useEditorSettings } from "./hooks/useEditorSettings";
import { useFileOperations } from "./hooks/useFileOperations";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAutoSave } from "./hooks/useAutoSave";
import { useOutlineManager } from "./hooks/useOutlineManager";
import { Flex, Box, Text } from "ui";

export default function Editor() {
	// State management hooks
	const editorState = useEditorState();
	const editorSettings = useEditorSettings();
	const { editorRef, updateOutline, handleGoToOutlineItem } = useOutlineManager();

	// Derived state
	const activeFile = editorState.files.find(f => f.name === editorState.activeFileName);

	// File operations
	const fileOperations = useFileOperations({
		...editorState,
		updateOutline,
	});

	// Auto-save functionality
	useAutoSave({
		autoSaveSettings: editorSettings.autoSaveSettings,
		isSaved: editorState.isSaved,
		activeFileName: editorState.activeFileName,
		activeFile,
		files: editorState.files,
		setIsSaved: editorState.setIsSaved,
		setModifiedTabs: editorState.setModifiedTabs,
	});

	// Keyboard shortcuts
	useKeyboardShortcuts({
		shortcuts: editorSettings.shortcuts,
		activeFileName: editorState.activeFileName,
		activeFile,
		canUndo: editorState.canUndo,
		canRedo: editorState.canRedo,
		handleDownloadFile: fileOperations.handleDownloadFile,
		handleChange: fileOperations.handleChange,
		setShowTerminal: editorState.setShowTerminal,
	});

	// Layout factory with all props
	const factory = createLayoutFactory({
		files: editorState.files,
		activeFileName: editorState.activeFileName,
		openTabs: editorState.openTabs,
		modifiedTabs: editorState.modifiedTabs,
		showTerminal: editorState.showTerminal,
		glyphMarginSettings: editorSettings.glyphMarginSettings,
		themeSettings: editorSettings.themeSettings,
		terminalSettings: editorSettings.terminalSettings,
		onSelectFile: fileOperations.handleSelectFile,
		onNewFile: fileOperations.handleNewFile,
		onUploadFile: fileOperations.handleUploadFile,
		onDeleteFile: fileOperations.handleDeleteFile,
		onRenameFile: fileOperations.handleRenameFile,
		onDownloadFile: fileOperations.handleDownloadFile,
		onOpenSettings: (tab) => {
			editorSettings.setSettingsTab(tab || "shortcuts");
			editorSettings.setShowSettings(true);
		},
		onChange: fileOperations.handleChange,
		onCloseTab: fileOperations.handleCloseTab,
		onGoToOutlineItem: handleGoToOutlineItem,
		editorRef,
	});

	// Replace all function for settings
	const handleReplaceAll = (search, replace) => {
		if (!search) return;
		editorState.setFiles(prevFiles =>
			prevFiles.map(file => ({
				...file,
				content: file.content.split(search).join(replace),
			}))
		);
	};

	return (
		<FilesProvider>
			<Flex direction="column" className='h-screen w-full bg-[#1e1e1e] text-white'>
				{/* Toolbar with Undo/Redo */}
				<Flex align="center" gap={4} className="bg-[#2d2d30] border-b border-gray-600 px-4 py-2">
					<UndoRedoToolbar 
						className="flex items-center"
						showDescriptions={false}
						iconSize={14}
					/>
					<Text size="xs" className="text-gray-400">
						Global Undo/Redo System Active
					</Text>
				</Flex>

				<LayoutManager factory={factory} />

				<StatusBar
					activeFileName={editorState.activeFileName}
					saved={editorState.isSaved}
					terminalVisible={editorState.showTerminal}
					onToggleTerminal={() => editorState.setShowTerminal(prev => !prev)}
				/>

				<SettingsPanel
					showSettings={editorSettings.showSettings}
					onClose={() => editorSettings.setShowSettings(false)}
					shortcuts={editorSettings.shortcuts}
					setShortcuts={editorSettings.setShortcuts}
					autoSaveSettings={editorSettings.autoSaveSettings}
					setAutoSaveSettings={editorSettings.setAutoSaveSettings}
					tabCompletionSettings={editorSettings.tabCompletionSettings}
					setTabCompletionSettings={editorSettings.setTabCompletionSettings}
					glyphMarginSettings={editorSettings.glyphMarginSettings}
					setGlyphMarginSettings={editorSettings.setGlyphMarginSettings}
					themeSettings={editorSettings.themeSettings}
					setThemeSettings={editorSettings.setThemeSettings}
					terminalSettings={editorSettings.terminalSettings}
					setTerminalSettings={editorSettings.setTerminalSettings}
					settingsTab={editorSettings.settingsTab}
					onReplaceAll={handleReplaceAll}
				/>
			</Flex>
		</FilesProvider>
	);
}