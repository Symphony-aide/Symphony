//EditorPanel.jsx
import React, { useRef, useMemo, useState } from "react";
import * as monaco from "@monaco-editor/react";
import { defaultMonacoOptions } from "./monacoOptions";
import { useEditor } from "./hooks/useEditor";
import { useEnhancedLanguageDetection } from "./hooks/useEnhancedLanguageDetection";
import { useEnhancedThemeManager } from "./hooks/useEnhancedThemeManager";
import { useEnhancedMonacoConfig } from "./hooks/useEnhancedMonacoConfig";
import EditorTabs from "./components/EditorTabs";
import SyntaxHighlighter from "../../syntax-highlighting/src/SyntaxHighlighter";

export default function EditorPanel({
	files,
	activeFileName,
	onSelectFile,
	openTabs,
	onChange,
	terminalVisible,
	onCloseTab,
	editorRef,
	glyphMarginSettings,
	modifiedTabs = [],
	themeSettings = { theme: "vs-dark", fontSize: 14 },
	onLanguageDetected = () => {},
}) {
	const containerRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);
	const [viewMode, setViewMode] = useState('editor'); // 'editor' or 'preview'

	// Enhanced language detection
	const languageInfo = useEnhancedLanguageDetection(
		activeFile?.name || "",
		null,
		activeFile?.content || ""
	);

	// Enhanced theme management
	const { themeData, createCustomTheme } = useEnhancedThemeManager(themeSettings.theme);

	// Enhanced Monaco configuration
	const {
		registerCustomTheme,
		enhanceMonacoOptions,
		addCustomTokenProviders,
		setupEnhancedFeatures
	} = useEnhancedMonacoConfig();

	const { handleEditorMount, handleEditorChange } = useEditor(
		editorRef,
		activeFile,
		terminalVisible,
		glyphMarginSettings
	);

	// Enhanced Monaco options with language-specific settings
	const enhancedOptions = useMemo(() => {
		return enhanceMonacoOptions(defaultMonacoOptions, themeData, languageInfo);
	}, [enhanceMonacoOptions, themeData, languageInfo]);

	// Notify parent when language is detected
	React.useEffect(() => {
		if (languageInfo.detectedLanguage && languageInfo.detectedLanguage !== 'plaintext') {
			onLanguageDetected(languageInfo.detectedLanguage);
		}
	}, [languageInfo.detectedLanguage, onLanguageDetected]);

	// Enhanced editor mount handler
	const handleEnhancedEditorMount = (editor, monacoInstance) => {
		// Register custom theme
		const customThemeId = registerCustomTheme(monacoInstance, themeData, themeSettings.theme);
		editor.updateOptions({ theme: customThemeId });

		// Add custom token providers
		addCustomTokenProviders(monacoInstance, languageInfo.detectedLanguage);

		// Setup enhanced features
		const cleanup = setupEnhancedFeatures(editor, monacoInstance, themeData, languageInfo);

		// Call original handler
		handleEditorMount(editor, monacoInstance);

		// Store cleanup function
		editor._enhancedCleanup = cleanup;
	};

	return (
		<div
			ref={containerRef}
			className='flex flex-col h-full w-full p-2 bg-gray-900 rounded-lg border border-gray-700'
		>
			{/* Tabs */}
			<EditorTabs
				openTabs={openTabs}
				files={files}
				activeFileName={activeFileName}
				modifiedTabs={modifiedTabs}
				onSelectFile={onSelectFile}
				onCloseTab={onCloseTab}
			/>

			{/* Editor */}
			<div className='flex-grow rounded overflow-hidden border border-gray-700'>
				{/* Language indicator and view toggle */}
				<div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700 text-xs text-gray-400">
					<div className="flex items-center space-x-3">
						<span>
							{languageInfo.getLanguageDisplayName(languageInfo.detectedLanguage)}
							{languageInfo.confidence !== 'high' && (
								<span className="ml-1 opacity-60">({languageInfo.confidence} confidence)</span>
							)}
						</span>

						{/* View Mode Toggle */}
						<div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
							<button
								onClick={() => setViewMode('editor')}
								className={`px-2 py-1 rounded text-xs transition-colors ${
									viewMode === 'editor'
										? 'bg-blue-600 text-white'
										: 'text-gray-300 hover:text-white hover:bg-gray-600'
								}`}
							>
								✏️ Edit
							</button>
							<button
								onClick={() => setViewMode('preview')}
								className={`px-2 py-1 rounded text-xs transition-colors ${
									viewMode === 'preview'
										? 'bg-blue-600 text-white'
										: 'text-gray-300 hover:text-white hover:bg-gray-600'
								}`}
							>
								👁️ Preview
							</button>
						</div>
					</div>

					<span className="text-xs opacity-60">
						{activeFile?.content?.split('\n').length || 0} lines
					</span>
				</div>

				{/* Conditional rendering based on view mode */}
				{viewMode === 'editor' ? (
					<monaco.Editor
						height='calc(100% - 28px)'
						language={languageInfo.detectedLanguage}
						value={activeFile?.content || ""}
						theme={themeSettings.theme}
						onChange={value => {
							const content = handleEditorChange(value);
							onChange(content);
						}}
						onMount={handleEnhancedEditorMount}
						options={{
							...enhancedOptions,
							fontSize: themeSettings.fontSize,
							fontFamily: themeSettings.fontFamily,
							glyphMargin: glyphMarginSettings.enabled,
						}}
					/>
				) : (
					<div className="h-full overflow-auto" style={{ height: 'calc(100% - 28px)' }}>
						<SyntaxHighlighter
							code={activeFile?.content || ""}
							language={languageInfo.detectedLanguage}
							theme={themeSettings.theme === 'vs-dark' ? 'dark' : 'light'}
							fileName={activeFile?.name || ""}
							showLineNumbers={true}
							onLanguageDetected={onLanguageDetected}
							className="w-full h-full"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
