//EditorPanel.jsx
import React, { useRef } from "react";
import * as monaco from "@monaco-editor/react";
import { defaultMonacoOptions } from "./monacoOptions";
import { detectLanguage } from "./utils/outlineParser";
import { useEditor } from "./hooks/useEditor";
import EditorTabs from "./components/EditorTabs";

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
}) {
	const containerRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);
	
	const { handleEditorMount, handleEditorChange } = useEditor(
		editorRef,
		activeFile,
		terminalVisible,
		glyphMarginSettings
	);

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
				<monaco.Editor
					height='100%'
					language={detectLanguage(activeFile?.name || "")}
					value={activeFile?.content || ""}
					theme={themeSettings.theme}
					onChange={value => {
						const content = handleEditorChange(value);
						onChange(content);
					}}
					onMount={handleEditorMount}
					options={{
						...defaultMonacoOptions,
						fontSize: themeSettings.fontSize,
						fontFamily: themeSettings.fontFamily,
						glyphMargin: glyphMarginSettings.enabled,
					}}
				/>
			</div>
		</div>
	);
}
