//Editor.jsx
import React, { useState, useEffect, useRef } from "react";
import FileExplorer from "./FileExplorer";
import EditorPanel from "./EditorPanel";
import ShortcutSettingsModal from "./ShortcutSettingsModal";
import hotkeys from "hotkeys-js";
import TerminalComponent from "./Terminal";
import StatusBar from "./StatusBar";
import GlobalSearchReplace from "./GlobalSearchReplace";

export default function Editor() {
	// 📌 Load files from localStorage
	const [files, setFiles] = useState(() => {
		try {
			const saved = JSON.parse(localStorage.getItem("files"));
			if (Array.isArray(saved) && saved.length) return saved;
		} catch {}
		return [{ name: "untitled.txt", content: "" }];
	});

	// 📌 Load active file name from localStorage
	const [activeFileName, setActiveFileName] = useState(() => {
		return localStorage.getItem("activeFileName") || "untitled.txt";
	});

	// 📌 Save files when they change
	useEffect(() => {
		localStorage.setItem("files", JSON.stringify(files));
	}, [files]);

	// 📌 Save activeFileName when it changes
	useEffect(() => {
		localStorage.setItem("activeFileName", activeFileName);
	}, [activeFileName]);

	// 📌 Ensure activeFileName is valid
	useEffect(() => {
		if (!files.some(f => f.name === activeFileName) && files.length) {
			setActiveFileName(files[0].name);
		}
	}, [files, activeFileName]);

	const activeFile = files.find(f => f.name === activeFileName);
	const editorRef = useRef(null);
	const [openTabs, setOpenTabs] = useState(() => {
		const saved = JSON.parse(localStorage.getItem("openTabs"));
		return Array.isArray(saved) ? saved : [];
	});
	useEffect(() => {
		localStorage.setItem("openTabs", JSON.stringify(openTabs));
	}, [openTabs]);

	const [isSaved, setIsSaved] = useState(true);
	const [showTerminal, setShowTerminal] = useState(true);

	const [shortcuts, setShortcuts] = useState(() => {
		try {
			const saved = JSON.parse(localStorage.getItem("shortcuts"));
			if (Array.isArray(saved)) return saved;
		} catch {}
		return [
			{ operation: "save", shortcut: "ctrl+s" },
			{ operation: "run", shortcut: "ctrl+r" },
			{ operation: "format", shortcut: "ctrl+f" },
			{ operation: "toggleTerminal", shortcut: "ctrl+`" },
		];
	});

	const [showSettings, setShowSettings] = useState(false);

	// Bind Hotkeys
	useEffect(() => {
		shortcuts.forEach(({ operation, shortcut }) => {
			if (!shortcut) return;

			hotkeys(shortcut, event => {
				event.preventDefault();

				if (operation === "save") {
					handleDownloadFile(activeFileName);
				} else if (operation === "format") {
					handleChange(activeFile.content.trim());
				} else if (operation === "run") {
					runCode(activeFile.content);
				} else if (operation === "toggleTerminal") {
					setShowTerminal(prev => !prev);
				}
			});
		});

		return () => {
			shortcuts.forEach(({ shortcut }) => {
				if (shortcut) hotkeys.unbind(shortcut);
			});
		};
	}, [shortcuts, activeFile]);

	// Handlers
	const handleNewFile = () => {
		const newName = prompt("Enter new file name:", "untitled.txt");
		if (!newName) return;
		if (files.some(f => f.name === newName)) {
			alert("A file with this name already exists!");
			return;
		}
		setFiles([...files, { name: newName, content: "" }]);
		setActiveFileName(newName);
	};

	const handleUploadFile = e => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const content = reader.result;
			if (files.some(f => f.name === file.name)) {
				alert("File with this name already exists!");
				return;
			}
			setFiles([...files, { name: file.name, content }]);
			setActiveFileName(file.name);
		};
		reader.readAsText(file);
	};

	const handleDeleteFile = name => {
		if (!window.confirm(`Delete ${name}?`)) return;
		const updated = files.filter(f => f.name !== name);
		setFiles(updated);

		setOpenTabs(tabs => tabs.filter(tab => tab !== name)); // remove from tabs too

		if (activeFileName === name && updated.length) {
			setActiveFileName(updated[0].name);
		} else if (!updated.length) {
			setActiveFileName("");
		}
	};

	const handleRenameFile = name => {
		const newName = prompt("Enter new name:", name);
		if (!newName || newName === name) return;
		if (files.some(f => f.name === newName)) {
			alert("A file with this name already exists!");
			return;
		}
		setFiles(files.map(f => (f.name === name ? { ...f, name: newName } : f)));
		if (activeFileName === name) setActiveFileName(newName);
	};

	const handleDownloadFile = name => {
		const file = files.find(f => f.name === name);
		if (!file) return;
		const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = file.name;
		a.click();
		URL.revokeObjectURL(url);
		setIsSaved(true);
	};

	const handleChange = newContent => {
		setFiles(files.map(f => (f.name === activeFileName ? { ...f, content: newContent } : f)));
		setIsSaved(false);
	};

	const handleReplaceAllInAllFiles = (search, replace) => {
		if (!search) return;
		setFiles(prevFiles =>
			prevFiles.map(file => ({
				...file,
				content: file.content.split(search).join(replace),
			}))
		);
	};

	const handleSelectFile = name => {
		setActiveFileName(name);
		if (!openTabs.includes(name)) {
			setOpenTabs([...openTabs, name]);
		}
	};

	const handleCloseTab = name => {
		setOpenTabs(prev => prev.filter(tab => tab !== name));

		if (activeFileName === name) {
			const index = openTabs.indexOf(name);
			const nextTab = openTabs[index + 1] || openTabs[index - 1];
			setActiveFileName(nextTab || "");
		}
	};

	return (
		<div className='flex flex-col h-full w-full'>
			<GlobalSearchReplace onReplaceAll={handleReplaceAllInAllFiles} />
			<div className='flex flex-grow overflow-hidden'>
				<FileExplorer
					files={files}
					activeFileName={activeFileName}
					onSelectFile={handleSelectFile}
					onNewFile={handleNewFile}
					onUploadFile={handleUploadFile}
					onDeleteFile={handleDeleteFile}
					onRenameFile={handleRenameFile}
					onDownloadFile={handleDownloadFile}
					onOpenSettings={() => setShowSettings(true)}
				/>

				<div className='relative flex-grow overflow-hidden bg-gray-900'>
					<EditorPanel
						files={files}
						activeFileName={activeFileName}
						onSelectFile={handleSelectFile}
						openTabs={openTabs}
						onChange={handleChange}
						editorRef={editorRef}
						onCloseTab={handleCloseTab}
					/>

					{showTerminal && (
						<div className='absolute bottom-0 left-0 right-0 h-[180px] border-t border-gray-700 bg-black'>
							<TerminalComponent />
						</div>
					)}
				</div>
			</div>

			<StatusBar
				activeFileName={activeFileName}
				saved={isSaved}
				terminalVisible={showTerminal}
				onToggleTerminal={() => setShowTerminal(prev => !prev)}
			/>

			{showSettings && (
				<ShortcutSettingsModal
					shortcuts={shortcuts}
					setShortcuts={setShortcuts}
					onClose={() => setShowSettings(false)}
				/>
			)}
		</div>
	);
}
