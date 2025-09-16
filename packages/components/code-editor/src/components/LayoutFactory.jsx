// LayoutFactory.jsx
import React from "react";
import FileExplorer from "../../../file-explorer/src/FileExplorer";
import EditorPanel from "../EditorPanel";
import OutlineView from "../../../outlineview/src/OutlineView";
import TerminalComponent from "../../../terminal/src/Terminal";

export function createLayoutFactory({
	files,
	activeFileName,
	openTabs,
	modifiedTabs,
	showTerminal,
	glyphMarginSettings,
	themeSettings,
	terminalSettings,
	onSelectFile,
	onNewFile,
	onUploadFile,
	onDeleteFile,
	onRenameFile,
	onDownloadFile,
	onOpenSettings,
	onChange,
	onCloseTab,
	onGoToOutlineItem,
	editorRef,
}) {
	return (node) => {
		const component = node.getComponent();
		
		if (component === "file-explorer") {
			return (
				<FileExplorer
					files={files}
					activeFileName={activeFileName}
					onSelectFile={onSelectFile}
					onNewFile={onNewFile}
					onUploadFile={onUploadFile}
					onDeleteFile={onDeleteFile}
					onRenameFile={onRenameFile}
					onDownloadFile={onDownloadFile}
					onOpenSettings={onOpenSettings}
					modifiedTabs={modifiedTabs}
				/>
			);
		}
		
		if (component === "editor") {
			return (
				<EditorPanel
					files={files}
					activeFileName={activeFileName}
					onSelectFile={onSelectFile}
					openTabs={openTabs}
					onChange={onChange}
					editorRef={editorRef}
					onCloseTab={onCloseTab}
					terminalVisible={showTerminal}
					glyphMarginSettings={glyphMarginSettings}
					modifiedTabs={modifiedTabs}
					themeSettings={themeSettings}
				/>
			);
		}
		
		if (component === "outline") {
			return <OutlineView onSelectItem={onGoToOutlineItem} />;
		}
		
		if (component === "terminal") {
			return showTerminal ? <TerminalComponent terminalSettings={terminalSettings} /> : null;
		}
		
		return null;
	};
}
