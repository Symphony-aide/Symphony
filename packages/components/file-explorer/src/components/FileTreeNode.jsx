// FileTreeNode.jsx
import React from "react";
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, File as FileIcon } from "lucide-react";
import { getIconForFile } from "vscode-icons-js";
import { Flex, Box, Text, Button, Input } from "ui";

const FileTreeNode = ({
	node,
	depth = 0,
	activeFileName,
	expanded,
	renamingPath,
	renameValue,
	onSelectFile,
	onToggleExpand,
	onContextMenu,
	onFileDragStart,
	onFolderDragStart,
	onFolderDragOver,
	onFolderDrop,
	onRenameValueChange,
	onRenameBlur,
	onRenameKeyDown,
	onSetRenamingPath,
	onGitStage,
	onGitCommit,
	getStatus,
	getSizeKB,
	statusBadge,
	sortChildren,
}) => {
	if (!node) return null;

	const fileIcon = name => {
		const iconPath = getIconForFile(name);

		if (iconPath) {
			return (
				<Box as="img"
					src={`https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/${iconPath}`}
					alt={name}
					className='w-4 h-4 inline-block'
				/>
			);
		}

		return <FileIcon className='w-4 h-4 text-gray-400' />;
	};

	if (node.type === "file") {
		const isActive = node.path === activeFileName;
		const stat = getStatus(node.fileRef);
		const sizeKB = getSizeKB(node.fileRef);
		const isRenaming = renamingPath === node.path;

		return (
			<Flex
				key={node.path}
				align="center"
				justify="between"
				className={`px-2 py-1 rounded cursor-pointer ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`}
				style={{ paddingLeft: 8 + depth * 14 }}
				title={`${sizeKB} KB • ${stat}`}
				onClick={() => onSelectFile(node.path)}
				onContextMenu={e => onContextMenu(e, { type: "file", fileNode: node })}
				draggable
				onDragStart={e => onFileDragStart(e, node.path)}
			>
				<Flex align="center" gap={2} className='overflow-hidden'>
					<Box as="span">{fileIcon(node.name)}</Box>

					{isRenaming ? (
						<Input
							autoFocus
							value={renameValue}
							onChange={e => onRenameValueChange(e.target.value)}
							onBlur={onRenameBlur}
							onKeyDown={onRenameKeyDown}
							className='bg-gray-800 text-white px-1 rounded text-sm w-[120px]'
						/>
					) : (
						<Text className='truncate'>{node.name}</Text>
					)}

					{statusBadge(stat)}
				</Flex>

				<Flex align="center" gap={1} className='text-xs'>
					<Text className='text-[10px] text-gray-400 mr-1'>{sizeKB}KB</Text>
					{stat !== "staged" && (
						<Button
							variant="ghost"
							size="sm"
							onClick={e => {
								e.stopPropagation();
								onGitStage && onGitStage(node.path);
							}}
							title='Stage'
							className="p-0 h-auto min-w-0"
						>
							S
						</Button>
					)}
					{stat === "staged" && (
						<Button
							variant="ghost"
							size="sm"
							onClick={e => {
								e.stopPropagation();
								onGitCommit && onGitCommit(node.path);
							}}
							title='Commit'
							className="p-0 h-auto min-w-0"
						>
							✓
						</Button>
					)}
				</Flex>
			</Flex>
		);
	}

	// folder
	const isOpen = !!expanded[node.path];
	const childrenArr = sortChildren(node.children);
	
	return (
		<Box key={node.path || "__root__"}>
			{node.path !== "" && (
				<Flex
					align="center"
					className='px-2 py-1 rounded cursor-pointer hover:bg-gray-700 select-none'
					style={{ paddingLeft: 4 + depth * 14 }}
					onClick={() => onToggleExpand(node.path)}
					onContextMenu={e => onContextMenu(e, { type: "folder", folderPath: node.path })}
					draggable
					onDragStart={e => onFolderDragStart(e, node.path)}
					onDragOver={onFolderDragOver}
					onDrop={e => onFolderDrop(e, node.path)}
				>
					{isOpen ? (
						<ChevronDown className='w-3.5 h-3.5 mr-1' />
					) : (
						<ChevronRight className='w-3.5 h-3.5 mr-1' />
					)}
					{isOpen ? (
						<FolderOpen className='w-3.5 h-3.5 mr-1' />
					) : (
						<FolderIcon className='w-3.5 h-3.5 mr-1' />
					)}
					{renamingPath === node.path ? (
						<Input
							autoFocus
							value={renameValue}
							onChange={e => onRenameValueChange(e.target.value)}
							onBlur={onRenameBlur}
							onKeyDown={onRenameKeyDown}
							className='bg-gray-800 text-white px-1 rounded text-sm w-[120px]'
						/>
					) : (
						<Text className='truncate'>{node.name || "root"}</Text>
					)}
				</Flex>
			)}
			{isOpen || node.path === "" ? (
				<Box>
					{childrenArr.map(child => 
						<FileTreeNode
							key={child.path || child.name}
							node={child}
							depth={node.path === "" ? 0 : depth + 1}
							activeFileName={activeFileName}
							expanded={expanded}
							renamingPath={renamingPath}
							renameValue={renameValue}
							onSelectFile={onSelectFile}
							onToggleExpand={onToggleExpand}
							onContextMenu={onContextMenu}
							onFileDragStart={onFileDragStart}
							onFolderDragStart={onFolderDragStart}
							onFolderDragOver={onFolderDragOver}
							onFolderDrop={onFolderDrop}
							onRenameValueChange={onRenameValueChange}
							onRenameBlur={onRenameBlur}
							onRenameKeyDown={onRenameKeyDown}
							onSetRenamingPath={onSetRenamingPath}
							onGitStage={onGitStage}
							onGitCommit={onGitCommit}
							getStatus={getStatus}
							getSizeKB={getSizeKB}
							statusBadge={statusBadge}
							sortChildren={sortChildren}
						/>
					)}
				</Box>
			) : null}
		</Box>
	);
};

export default FileTreeNode;
