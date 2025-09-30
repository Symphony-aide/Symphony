// useFileOperations.js
import { useCallback } from "react";
import { useCommand } from "@symphony/commands";
import { 
	FileCreateCommand, 
	FileDeleteCommand, 
	FileRenameCommand, 
	FileContentUpdateCommand 
} from "../commands/FileOperationCommands.js";

export function useFileOperations({
	files,
	setFiles,
	activeFileName,
	setActiveFileName,
	openTabs,
	setOpenTabs,
	modifiedTabs,
	setModifiedTabs,
	setIsSaved,
	updateOutline,
}) {
	const { executeCommand } = useCommand();

	// File manager interface for commands
	const fileManager = {
		async createFile(fileName, content = '') {
			setFiles(prevFiles => [...prevFiles, { name: fileName, content }]);
		},

		async deleteFile(fileName) {
			setFiles(prevFiles => prevFiles.filter(f => f.name !== fileName));
		},

		async renameFile(oldName, newName) {
			setFiles(prevFiles => prevFiles.map(f => 
				f.name === oldName ? { ...f, name: newName } : f
			));
		},

		async updateFileContent(fileName, content) {
			setFiles(prevFiles => prevFiles.map(f => 
				f.name === fileName ? { ...f, content } : f
			));
		}
	};

	// Editor state manager for handling tabs and active file during commands
	const editorStateManager = {
		updateFileRename(oldName, newName) {
			// Update open tabs
			setOpenTabs(prev => prev.map(tab => tab === oldName ? newName : tab));
			
			// Update modified tabs
			setModifiedTabs(prev => prev.map(tab => tab === oldName ? newName : tab));
			
			// Update active file if it matches
			if (activeFileName === oldName) {
				setActiveFileName(newName);
			}
		}
	};
	const handleSelectFile = useCallback((name) => {
		if (!openTabs.includes(name)) setOpenTabs([...openTabs, name]);
		setActiveFileName(name);
		const file = files.find(f => f.name === name);
		if (file) updateOutline(file.content);
	}, [files, openTabs, setOpenTabs, setActiveFileName, updateOutline]);

	const handleNewFile = useCallback(async () => {
		const newName = prompt("Enter new file name:", "untitled.txt");
		if (!newName) return;
		if (files.some(f => f.name === newName)) {
			alert("A file with this name already exists!");
			return;
		}
		
		const command = new FileCreateCommand(fileManager, newName, "");
		await executeCommand(command);
		setActiveFileName(newName);
		updateOutline("");
	}, [files, executeCommand, setActiveFileName, updateOutline]);

	const handleUploadFile = useCallback(async (file) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			const content = e.target.result;
			const command = new FileCreateCommand(fileManager, file.name, content);
			await executeCommand(command);
			handleSelectFile(file.name);
			updateOutline(content);
		};
		reader.readAsText(file);
	}, [executeCommand, handleSelectFile, updateOutline]);

	const handleDeleteFile = useCallback(async (name) => {
		const file = files.find(f => f.name === name);
		if (!file) return;
		
		const command = new FileDeleteCommand(fileManager, name, file.content);
		await executeCommand(command);
		
		setOpenTabs(openTabs.filter(tab => tab !== name));
		setModifiedTabs(prev => prev.filter(tab => tab !== name));
		if (activeFileName === name) setActiveFileName(files[0]?.name || "");
	}, [files, executeCommand, openTabs, setOpenTabs, setModifiedTabs, activeFileName, setActiveFileName]);

	const handleRenameFile = useCallback(async (oldName, newName) => {
		const command = new FileRenameCommand(fileManager, oldName, newName, editorStateManager);
		await executeCommand(command);
		
		// Note: Editor state updates are now handled by the command itself
		// This ensures they happen during both execute and undo operations
	}, [executeCommand, activeFileName, setActiveFileName, setOpenTabs, setModifiedTabs]);

	const handleDownloadFile = useCallback((name) => {
		const file = files.find(f => f.name === activeFileName);
		const blob = new Blob([file.content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
		setIsSaved(true);
		setModifiedTabs(prev => prev.filter(tab => tab !== name));
	}, [files, activeFileName, setIsSaved, setModifiedTabs]);

	const handleCloseTab = useCallback((name) => {
		setOpenTabs(openTabs.filter(tab => tab !== name));
		if (activeFileName === name) setActiveFileName(openTabs.find(tab => tab !== name) || files[0]?.name);
	}, [openTabs, setOpenTabs, activeFileName, setActiveFileName, files]);

	const handleChange = useCallback(async (newContent) => {
		const file = files.find(f => f.name === activeFileName);
		if (!file || file.content === newContent) return;
		
		const command = new FileContentUpdateCommand(fileManager, activeFileName, newContent, file.content);
		await executeCommand(command);
		
		setIsSaved(false);
		if (!modifiedTabs.includes(activeFileName)) {
			setModifiedTabs(prev => [...prev, activeFileName]);
		}
		updateOutline(newContent);
	}, [files, executeCommand, activeFileName, setIsSaved, modifiedTabs, setModifiedTabs, updateOutline]);

	return {
		handleSelectFile,
		handleNewFile,
		handleUploadFile,
		handleDeleteFile,
		handleRenameFile,
		handleDownloadFile,
		handleCloseTab,
		handleChange,
	};
}
