// Editor.jsx

import React, { useState, useRef, useEffect } from "react";
import { Layout, Model } from "flexlayout-react";
import { useSetAtom } from "jotai";
import debounce from "lodash.debounce";
import hotkeys from "hotkeys-js";
import useUndo from "use-undo";
import { FilesProvider } from "./FilesProvider";
import "flexlayout-react/style/light.css";

import FileExplorer from "./FileExplorer";
import EditorPanel from "./EditorPanel";
import TerminalComponent from "./Terminal";
import OutlineView from "./OutlineView";
import ShortcutSettingsModal from "./ShortcutSettingsModal";
import StatusBar from "./StatusBar";
import GlobalSearchReplace from "./GlobalSearchReplace";
import { outlineAtom } from "./outlineAtom";

const defaultLayoutModel = {
	global: {},
	borders: [],
	layout: {
		type: "row",
		children: [
			{
				type: "column",
				weight: 20,
				children: [
					{
						type: "tabset",
						children: [
							{ type: "tab", name: "Explorer", component: "file-explorer" },
							{ type: "tab", name: "Outline", component: "outline" },
						],
					},
				],
			},
			{
				type: "column",
				weight: 80,
				children: [
					{
						type: "tabset",
						weight: 70,
						children: [{ type: "tab", name: "Editor", component: "editor" }],
					},
					{
						type: "tabset",
						weight: 30,
						children: [{ type: "tab", name: "Terminal", component: "terminal" }],
					},
				],
			},
		],
	},
};

export default function Editor() {
	const layoutRef = useRef();
	const savedLayout = localStorage.getItem("layoutModel");
	const [model, setModel] = useState(() =>
		savedLayout ? Model.fromJson(JSON.parse(savedLayout)) : Model.fromJson(defaultLayoutModel)
	);

	const setOutline = useSetAtom(outlineAtom);

	const savedFiles = localStorage.getItem("files");
	const initialFiles = savedFiles ? JSON.parse(savedFiles) : [{ name: "untitled.txt", content: "" }];

	const [filesState, { set: setFiles, undo, redo, canUndo, canRedo }] = useUndo(initialFiles);

	const files = filesState.present;

	const [activeFileName, setActiveFileName] = useState(
		() => localStorage.getItem("activeFileName") || "untitled.txt"
	);

	const [openTabs, setOpenTabs] = useState(() => {
		const saved = JSON.parse(localStorage.getItem("openTabs"));
		return Array.isArray(saved) ? saved : [];
	});

	const [isSaved, setIsSaved] = useState(true);
	const [showTerminal, setShowTerminal] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
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

	const editorRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);

	useEffect(() => localStorage.setItem("files", JSON.stringify(files)), [files]);
	useEffect(() => localStorage.setItem("activeFileName", activeFileName), [activeFileName]);
	useEffect(() => localStorage.setItem("openTabs", JSON.stringify(openTabs)), [openTabs]);

	useEffect(() => {
		if (!model || typeof model.toJson !== "function" || typeof model.addListener !== "function") return;
		const saveLayout = () => {
			try {
				const json = model.toJson();
				localStorage.setItem("layoutModel", JSON.stringify(json));
			} catch (err) {
				console.error("Failed to save layout:", err);
			}
		};
		model.addListener("modelChanged", saveLayout);
		return () => model.removeListener("modelChanged", saveLayout);
	}, [model]);

	useEffect(() => {
		shortcuts.forEach(({ operation, shortcut }) => {
			if (!shortcut) return;
			hotkeys(shortcut, event => {
				event.preventDefault();
				if (operation === "save") handleDownloadFile(activeFileName);
				else if (operation === "format") handleChange(activeFile?.content.trim() || "");
				else if (operation === "run") console.log("Running code...");
				else if (operation === "toggleTerminal") setShowTerminal(prev => !prev);
			});
		});
		hotkeys("ctrl+z", e => {
			e.preventDefault();
			if (canUndo) undo();
		});
		hotkeys("ctrl+y, ctrl+shift+z", e => {
			e.preventDefault();
			if (canRedo) redo();
		});
		return () => {
			shortcuts.forEach(({ shortcut }) => shortcut && hotkeys.unbind(shortcut));
			hotkeys.unbind("ctrl+z");
			hotkeys.unbind("ctrl+y");
			hotkeys.unbind("ctrl+shift+z");
		};
	}, [shortcuts, activeFileName, activeFile, canUndo, canRedo]);

	const updateOutline = debounce(content => {
		try {
			const outline = [];
			const lines = content.split("\n");
			lines.forEach((line, index) => {
				const funcMatch = line.match(/^\s*function\s+(\w+)/);
				const varMatch = line.match(/^\s*(const|let|var)\s+(\w+)/);
				if (funcMatch) outline.push({ label: funcMatch[1], line: index + 1 });
				else if (varMatch) outline.push({ label: varMatch[2], line: index + 1 });
			});
			setOutline(outline);
		} catch (err) {
			console.error("Outline parse error", err);
		}
	}, 300);

	const handleChange = newContent => {
		setFiles(files.map(f => (f.name === activeFileName ? { ...f, content: newContent } : f)));
		setIsSaved(false);
		updateOutline(newContent);
	};

	const handleSelectFile = name => {
		if (!openTabs.includes(name)) setOpenTabs([...openTabs, name]);
		setActiveFileName(name);
		const file = files.find(f => f.name === name);
		if (file) updateOutline(file.content);
	};

	const handleNewFile = () => {
		const newName = prompt("Enter new file name:", "untitled.txt");
		if (!newName) return;
		if (files.some(f => f.name === newName)) {
			alert("A file with this name already exists!");
			return;
		}
		setFiles([...files, { name: newName, content: "" }]);
		setActiveFileName(newName);
		updateOutline("");
	};

	const handleUploadFile = file => {
		const reader = new FileReader();
		reader.onload = e => {
			const content = e.target.result;
			setFiles([...files, { name: file.name, content }]);
			handleSelectFile(file.name);
			updateOutline(content);
		};
		reader.readAsText(file);
	};

	const handleDeleteFile = name => {
		setFiles(files.filter(f => f.name !== name));
		setOpenTabs(openTabs.filter(tab => tab !== name));
		if (activeFileName === name) setActiveFileName(files[0]?.name || "");
	};

	const handleRenameFile = (oldName, newName) => {
		setFiles(files.map(f => (f.name === oldName ? { ...f, name: newName } : f)));
		if (activeFileName === oldName) setActiveFileName(newName);
	};

	const handleDownloadFile = name => {
		const file = files.find(f => f.name === activeFileName);
		const blob = new Blob([file.content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
		setIsSaved(true);
	};

	const handleCloseTab = name => {
		setOpenTabs(openTabs.filter(tab => tab !== name));
		if (activeFileName === name) setActiveFileName(openTabs.find(tab => tab !== name) || files[0]?.name);
	};

	const handleGoToOutlineItem = item => {
		if (!editorRef.current) return;
		const editor = editorRef.current;
		const model = editor.getModel();
		if (!model) return;
		let position;
		if (item.start !== undefined) position = model.getPositionAt(item.start);
		else if (item.line) position = { lineNumber: item.line, column: 1 };
		if (position) {
			editor.revealPositionInCenter(position);
			editor.setPosition(position);
			editor.focus();
		}
	};

	const resetLayout = () => {
		localStorage.removeItem("layoutModel");
		setModel(Model.fromJson(defaultLayoutModel));
	};

	const factory = node => {
		const component = node.getComponent();
		if (component === "file-explorer") {
			return (
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
			);
		}
		if (component === "editor") {
			return (
				<EditorPanel
					files={files}
					activeFileName={activeFileName}
					onSelectFile={handleSelectFile}
					openTabs={openTabs}
					onChange={handleChange}
					editorRef={editorRef}
					onCloseTab={handleCloseTab}
					terminalVisible={showTerminal}
				/>
			);
		}
		if (component === "outline") return <OutlineView onSelectItem={handleGoToOutlineItem} />;
		if (component === "terminal") return showTerminal ? <TerminalComponent /> : null;
		return null;
	};

	return (
		<FilesProvider>
			<div className='h-screen w-full flex flex-col bg-[#1e1e1e] text-white'>
				<GlobalSearchReplace
					onReplaceAll={(search, replace) => {
						if (!search) return;
						setFiles(prevFiles =>
							prevFiles.map(file => ({
								...file,
								content: file.content.split(search).join(replace),
							}))
						);
					}}
				/>
				<div className='flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-gray-600 text-sm z-10 relative'>
					<h1 className='text-base font-semibold'>Symphony Editor</h1>
					<div className='flex items-center space-x-2'>
						<button
							className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs'
							onClick={resetLayout}
						>
							Reset Layout
						</button>
					</div>
				</div>
				<div className='flex-1 overflow-hidden relative'>
					<div className='absolute inset-0'>
						<Layout ref={layoutRef} model={model} factory={factory} />
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
		</FilesProvider>
	);
}
