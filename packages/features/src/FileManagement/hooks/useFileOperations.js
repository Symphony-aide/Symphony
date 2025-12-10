// useFileOperations.js
import { useCallback } from "react";
import { useCommand } from "@symphony/commands";
import { 
	FileCreateCommand, 
	FileDeleteCommand, 
	FileRenameCommand, 
	FileContentUpdateCommand 
} from "../commands/FileOperationCommands";

/**
 * Provides file operation handlers (CRUD operations)
 * @param {Object} params - File state and setters
 * @returns {Object} File operation handlers
 */
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
	onFileChange,
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

	const selectFile = useCallback((name) => {
		if (!openTabs.includes(name)) setOpenTabs([...openTabs, name]);
		setActiveFileName(name);
		const file = files.find(f => f.name === name);
		if (file && onFileChange) onFileChange(file);
	}, [files, openTabs, setOpenTabs, setActiveFileName, onFileChange]);

	const createFile = useCallback(async (fileName, content = "") => {
		if (!fileName) {
			fileName = prompt("Enter new file name:", "untitled.txt");
			if (!fileName) return;
		}
		
		if (files.some(f => f.name === fileName)) {
			alert("A file with this name already exists!");
			return;
		}
		
		const command = new FileCreateCommand(fileManager, fileName, content);
		await executeCommand(command);
		setActiveFileName(fileName);
		if (onFileChange) onFileChange({ name: fileName, content });
	}, [files, executeCommand, setActiveFileName, onFileChange]);

	const uploadFile = useCallback(async (file) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			const content = e.target.result;
			const command = new FileCreateCommand(fileManager, file.name, content);
			await executeCommand(command);
			selectFile(file.name);
		};
		reader.readAsText(file);
	}, [executeCommand, selectFile]);

	const deleteFile = useCallback(async (name) => {
		const file = files.find(f => f.name === name);
		if (!file) return;
		
		const command = new FileDeleteCommand(fileManager, name, file.content);
		await executeCommand(command);
		
		setOpenTabs(openTabs.filter(tab => tab !== name));
		setModifiedTabs(prev => prev.filter(tab => tab !== name));
		if (activeFileName === name) setActiveFileName(files[0]?.name || "");
	}, [files, executeCommand, openTabs, setOpenTabs, setModifiedTabs, activeFileName, setActiveFileName]);

	const renameFile = useCallback(async (oldName, newName) => {
		if (!newName) {
			newName = prompt("Enter new file name:", oldName);
			if (!newName || newName === oldName) return;
		}
		
		const command = new FileRenameCommand(fileManager, oldName, newName, editorStateManager);
		await executeCommand(command);
	}, [executeCommand]);

	const downloadFile = useCallback((name) => {
		const file = files.find(f => f.name === name || f.name === activeFileName);
		if (!file) return;
		
		const blob = new Blob([file.content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name || file.name;
		a.click();
		URL.revokeObjectURL(url);
		setIsSaved(true);
		setModifiedTabs(prev => prev.filter(tab => tab !== (name || file.name)));
	}, [files, activeFileName, setIsSaved, setModifiedTabs]);

	const closeTab = useCallback((name) => {
		setOpenTabs(openTabs.filter(tab => tab !== name));
		if (activeFileName === name) {
			const nextTab = openTabs.find(tab => tab !== name) || files[0]?.name;
			setActiveFileName(nextTab);
		}
	}, [openTabs, setOpenTabs, activeFileName, setActiveFileName, files]);

	const updateFileContent = useCallback(async (newContent) => {
		const file = files.find(f => f.name === activeFileName);
		if (!file || file.content === newContent) return;
		
		const command = new FileContentUpdateCommand(fileManager, activeFileName, newContent, file.content);
		await executeCommand(command);
		
		setIsSaved(false);
		if (!modifiedTabs.includes(activeFileName)) {
			setModifiedTabs(prev => [...prev, activeFileName]);
		}
		if (onFileChange) onFileChange({ name: activeFileName, content: newContent });
	}, [files, executeCommand, activeFileName, setIsSaved, modifiedTabs, setModifiedTabs, onFileChange]);

	return {
		selectFile,
		createFile,
		uploadFile,
		deleteFile,
		renameFile,
		downloadFile,
		closeTab,
		updateFileContent,
	};
}
