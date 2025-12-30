// ContextMenu.jsx
import React from "react";
import { Box, Flex, Button, Separator } from "ui";

const ContextMenu = ({
	contextMenu,
	onClose,
	onSelectFile,
	onSetRenamingPath,
	onSetRenameValue,
	onDeleteFile,
	onDownloadFile,
	onGitStage,
	onGitCommit,
	onGitRevert,
	onNewFileInFolder,
	onCreateFolder,
	onDeleteFolder,
}) => {
	if (!contextMenu) return null;

	return (
		<Box
			onMouseLeave={onClose}
			style={{ left: contextMenu.x, top: contextMenu.y }}
			className='absolute z-50 bg-gray-900 border border-gray-700 rounded shadow p-2'
		>
			<Flex direction="column" gap={1} className='text-sm'>
				{contextMenu.type === "file" ? (
					<>
						<Button
							variant="ghost"
							onClick={() => {
								onSelectFile(contextMenu.fileNode.path);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Open
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								onSetRenamingPath(contextMenu.fileNode.path);
								onSetRenameValue(contextMenu.fileNode.name);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Rename
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								onDeleteFile(contextMenu.fileNode.path);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Delete
						</Button>
						<Separator className='my-1' />
						<Button
							variant="ghost"
							onClick={() => {
								onDownloadFile(contextMenu.fileNode.path);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Download
						</Button>
						<Separator className='my-1' />
						<Button
							variant="ghost"
							onClick={() => {
								if (onGitStage) onGitStage(contextMenu.fileNode.path);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Stage (Git)
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								if (onGitCommit) onGitCommit(contextMenu.fileNode.path);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Commit (Git)
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								if (onGitRevert) onGitRevert(contextMenu.fileNode.path);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Revert Git
						</Button>
					</>
				) : (
					// Folder menu
					<>
						<Button
							variant="ghost"
							onClick={() => {
								if (onNewFileInFolder) {
									onNewFileInFolder(contextMenu.folderPath);
								} else {
									const base = prompt("New file name (e.g. index.js):", "untitled.txt");
									if (base) {
										const full = `${contextMenu.folderPath.replace(/\/$/, "")}/${base}`;
										alert(
											`Create a new file named:\n${full}\n\nTip: Use "New File" and type the full path.`
										);
									}
								}
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							New File
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								onCreateFolder(contextMenu.folderPath);
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							New Folder
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								onSetRenamingPath(contextMenu.folderPath);
								onSetRenameValue(contextMenu.folderPath.split("/").pop());
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Rename Folder
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								// onDeleteFolder will be passed as a prop
								if (onDeleteFolder) {
									onDeleteFolder(contextMenu.folderPath);
								}
								onClose();
							}}
							className='justify-start text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Delete Folder
						</Button>
					</>
				)}
			</Flex>
		</Box>
	);
};

export default ContextMenu;
