// useFileOperations.js
import { useCallback } from "react";

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
	const handleSelectFile = useCallback((name) => {
		if (!openTabs.includes(name)) setOpenTabs([...openTabs, name]);
		setActiveFileName(name);
		const file = files.find(f => f.name === name);
		if (file) updateOutline(file.content);
	}, [files, openTabs, setOpenTabs, setActiveFileName, updateOutline]);

	const handleNewFile = useCallback(() => {
		const newName = prompt("Enter new file name:", "untitled.txt");
		if (!newName) return;
		if (files.some(f => f.name === newName)) {
			alert("A file with this name already exists!");
			return;
		}
		setFiles([...files, { name: newName, content: "" }]);
		setActiveFileName(newName);
		updateOutline("");
	}, [files, setFiles, setActiveFileName, updateOutline]);

	const handleUploadFile = useCallback((file) => {
		const reader = new FileReader();
		reader.onload = e => {
			const content = e.target.result;
			setFiles([...files, { name: file.name, content }]);
			handleSelectFile(file.name);
			updateOutline(content);
		};
		reader.readAsText(file);
	}, [files, setFiles, handleSelectFile, updateOutline]);

	const handleDeleteFile = useCallback((name) => {
		setFiles(files.filter(f => f.name !== name));
		setOpenTabs(openTabs.filter(tab => tab !== name));
		setModifiedTabs(prev => prev.filter(tab => tab !== name));
		if (activeFileName === name) setActiveFileName(files[0]?.name || "");
	}, [files, setFiles, openTabs, setOpenTabs, setModifiedTabs, activeFileName, setActiveFileName]);

	const handleRenameFile = useCallback((oldName, newName) => {
		setFiles(files.map(f => (f.name === oldName ? { ...f, name: newName } : f)));
		setOpenTabs(prev => prev.map(tab => (tab === oldName ? newName : tab)));
		setModifiedTabs(prev => prev.map(tab => (tab === oldName ? newName : tab)));
		if (activeFileName === oldName) setActiveFileName(newName);
	}, [files, setFiles, openTabs, setOpenTabs, setModifiedTabs, activeFileName, setActiveFileName]);

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

	const handleChange = useCallback((newContent) => {
		setFiles(files.map(f => (f.name === activeFileName ? { ...f, content: newContent } : f)));
		setIsSaved(false);
		if (!modifiedTabs.includes(activeFileName)) {
			setModifiedTabs(prev => [...prev, activeFileName]);
		}
		updateOutline(newContent);
	}, [files, setFiles, activeFileName, setIsSaved, modifiedTabs, setModifiedTabs, updateOutline]);

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
