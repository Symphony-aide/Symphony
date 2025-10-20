// FileExplorer.jsx
import React, { useState, useRef, useMemo } from "react";
import FileTreeNode from "./components/FileTreeNode";
import FilterControls from "./components/FilterControls";
import SearchTab from "./components/SearchTab";
import ContextMenu from "./components/ContextMenu";
import ActionButtons from "./components/ActionButtons";
import { useFolderOperations } from "./hooks/useFolderOperations";
import { useFileTree } from "./hooks/useFileTree.jsx";
import { Button } from "ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui";

export default function FileExplorer({
	files,
	activeFileName,
	onSelectFile,
	onNewFile,
	onUploadFile,
	onDeleteFile,
	onRenameFile,
	onDownloadFile,
	onOpenSettings,
	modifiedTabs = [],
	gitStatusMap = {},
	onGitStage,
	onGitCommit,
	onGitRevert,
	onReorderFiles,
	onNewFileInFolder,
}) {
	// State management
	const [activeTab, setActiveTab] = useState("files");
	const [searchTerm, setSearchTerm] = useState("");
	const [extFilter, setExtFilter] = useState("all");
	const [sizeFilter, setSizeFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("name");
	const [renamingPath, setRenamingPath] = useState(null);
	const [renameValue, setRenameValue] = useState("");
	const [contextMenu, setContextMenu] = useState(null);
	const dragIndex = useRef(null);

	// Custom hooks
	const {
		userFolders,
		expanded,
		toggleExpand,
		createFolder,
		renameFolder,
		deleteFolder,
		setExpanded,
	} = useFolderOperations(files, onRenameFile, onDeleteFile);

	const {
		tree,
		allExtensions,
		allStatuses,
		filterTree,
		sortChildren,
		getVisibleFilesFlat,
		getStatus,
		getSizeKB,
		statusBadge,
	} = useFileTree(files, userFolders, modifiedTabs, gitStatusMap);

	// Computed values
	const filteredTree = useMemo(
		() => filterTree(tree, extFilter, sizeFilter, statusFilter, searchTerm) || { type: "folder", name: "", path: "", children: new Map() },
		[tree, filterTree, extFilter, sizeFilter, statusFilter, searchTerm]
	);

	const visibleFilesFlat = useMemo(
		() => getVisibleFilesFlat(extFilter, sizeFilter, statusFilter, sortBy, searchTerm),
		[getVisibleFilesFlat, extFilter, sizeFilter, statusFilter, sortBy, searchTerm]
	);

	// Event handlers
	const openContextMenu = (e, payload) => {
		e.preventDefault();
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			...payload,
		});
	};
	
	const closeContextMenu = () => setContextMenu(null);

	// Drag & drop handlers
	const onFileDragStart = (e, filePath) => {
		e.dataTransfer.setData("text/plain", filePath);
		e.dataTransfer.setData("application/x-drag-type", "file");
		e.dataTransfer.effectAllowed = "move";
	};

	const onFolderDragStart = (e, folderPath) => {
		e.dataTransfer.setData("text/plain", folderPath);
		e.dataTransfer.setData("application/x-drag-type", "folder");
		e.dataTransfer.effectAllowed = "move";
	};

	const onFolderDragOver = e => {
		e.preventDefault();
	};

	const onFolderDrop = (e, targetFolderPath) => {
		e.preventDefault();
		const draggedPath = e.dataTransfer.getData("text/plain");
		const dragType = e.dataTransfer.getData("application/x-drag-type");
		
		if (!draggedPath) return;
		
		// Prevent dropping a folder into itself or its children
		if (dragType === "folder" && (draggedPath === targetFolderPath || targetFolderPath.startsWith(draggedPath + "/"))) {
			return;
		}
		
		const base = draggedPath.split("/").pop();
		const cleanTarget = targetFolderPath.replace(/\/$/, "");
		const newPath = cleanTarget ? `${cleanTarget}/${base}` : base;
		
		if (newPath === draggedPath) return;
		
		if (dragType === "folder") {
			// Handle folder move
			renameFolder(draggedPath, newPath);
		} else {
			// Handle file move
			onRenameFile && onRenameFile(draggedPath, newPath);
		}
		
		setExpanded(prev => ({ ...prev, [targetFolderPath]: true }));
	};

	// Rename handlers
	const handleRenameBlur = () => {
		if (renameValue && renameValue !== renamingPath?.split("/").pop()) {
			// Check if it's a file or folder
			const isFile = files.some(f => f.name === renamingPath);
			if (isFile) {
				const parent = renamingPath.includes("/") ? renamingPath.slice(0, renamingPath.lastIndexOf("/")) : "";
				const newPath = parent ? `${parent}/${renameValue}` : renameValue;
				onRenameFile(renamingPath, newPath);
			} else {
				renameFolder(renamingPath, renameValue);
			}
		}
		setRenamingPath(null);
	};

	const handleRenameKeyDown = e => {
		if (e.key === "Enter") {
			e.target.blur();
		} else if (e.key === "Escape") {
			setRenamingPath(null);
		}
	};

	// ====== Drag reorder (قائمة مسطحة فقط) — نسيبها كما هي لو حبيت تستخدمها ======
	const handleDragStart = (e, idx) => {
		dragIndex.current = idx;
		e.dataTransfer.effectAllowed = "move";
	};
	const handleDragOver = e => {
		e.preventDefault();
	};
	const handleDrop = (e, toIndex) => {
		e.preventDefault();
		const fromIndex = dragIndex.current;
		if (fromIndex == null) return;
		if (typeof onReorderFiles === "function") onReorderFiles(fromIndex, toIndex);
		dragIndex.current = null;
	};

	return (
		<div className='bg-gray-800 text-white w-64 p-3 border-r border-gray-700 flex flex-col relative'>
			{/* Header */}
			<div className='flex items-center justify-between mb-4 relative'>
				<h2 className='text-xs tracking-widest text-gray-300'>EXPLORER</h2>
				<Button 
					variant="ghost" 
					size="sm"
					onClick={() => onOpenSettings("shortcuts")} 
					className='hover:text-gray-400 p-1' 
					title='Settings'
				>
					⚙️
				</Button>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-3">
				<TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full">
					<TabsTrigger value="files" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow flex-1">
						Files
					</TabsTrigger>
					<TabsTrigger value="search" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow flex-1">
						Search
					</TabsTrigger>
				</TabsList>

				{/* Content */}
				<div className='flex-grow overflow-y-auto'>
					<TabsContent value="files">
						{/* Filters */}
						<FilterControls
							extFilter={extFilter}
							setExtFilter={setExtFilter}
							sizeFilter={sizeFilter}
							setSizeFilter={setSizeFilter}
							statusFilter={statusFilter}
							setStatusFilter={setStatusFilter}
							sortBy={sortBy}
							setSortBy={setSortBy}
							allExtensions={allExtensions}
							allStatuses={allStatuses}
						/>

						{/* Tree */}
						<div className='flex flex-col space-y-1 mb-4'>
							{Array.from(filteredTree.children.values()).length === 0 ? (
								<p className='text-sm text-gray-400 p-2'>No files match current filters</p>
							) : (
								<FileTreeNode
									node={filteredTree}
									depth={0}
									activeFileName={activeFileName}
									expanded={expanded}
									renamingPath={renamingPath}
									renameValue={renameValue}
									onSelectFile={onSelectFile}
									onToggleExpand={toggleExpand}
									onContextMenu={openContextMenu}
									onFileDragStart={onFileDragStart}
									onFolderDragStart={onFolderDragStart}
									onFolderDragOver={onFolderDragOver}
									onFolderDrop={onFolderDrop}
									onRenameValueChange={setRenameValue}
									onRenameBlur={handleRenameBlur}
									onRenameKeyDown={handleRenameKeyDown}
									onSetRenamingPath={setRenamingPath}
									onGitStage={onGitStage}
									onGitCommit={onGitCommit}
									getStatus={getStatus}
									getSizeKB={getSizeKB}
									statusBadge={statusBadge}
									sortChildren={(childrenMap) => sortChildren(childrenMap, sortBy)}
								/>
							)}
						</div>

						{/* Actions */}
						<ActionButtons
							onNewFile={onNewFile}
							onCreateFolder={createFolder}
							onUploadFile={onUploadFile}
						/>
					</TabsContent>

					<TabsContent value="search">
						<SearchTab
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							visibleFilesFlat={visibleFilesFlat}
							onSelectFile={onSelectFile}
							setActiveTab={setActiveTab}
						/>
					</TabsContent>
				</div>
			</Tabs>

			{/* Context menu */}
			<ContextMenu
				contextMenu={contextMenu}
				onClose={closeContextMenu}
				onSelectFile={onSelectFile}
				onSetRenamingPath={setRenamingPath}
				onSetRenameValue={setRenameValue}
				onDeleteFile={onDeleteFile}
				onDownloadFile={onDownloadFile}
				onGitStage={onGitStage}
				onGitCommit={onGitCommit}
				onGitRevert={onGitRevert}
				onNewFileInFolder={onNewFileInFolder}
				onCreateFolder={createFolder}
				onDeleteFolder={deleteFolder}
			/>
		</div>
	);
}
