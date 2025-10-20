// ContextMenu.jsx
import React from "react";

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
		<div
			onMouseLeave={onClose}
			style={{ left: contextMenu.x, top: contextMenu.y }}
			className='absolute z-50 bg-gray-900 border border-gray-700 rounded shadow p-2'
		>
			<div className='flex flex-col space-y-1 text-sm'>
				{contextMenu.type === "file" ? (
					<>
						<button
							onClick={() => {
								onSelectFile(contextMenu.fileNode.path);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Open
						</button>
						<button
							onClick={() => {
								onSetRenamingPath(contextMenu.fileNode.path);
								onSetRenameValue(contextMenu.fileNode.name);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Rename
						</button>
						<button
							onClick={() => {
								onDeleteFile(contextMenu.fileNode.path);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Delete
						</button>
						<div className='border-t border-gray-700 my-1' />
						<button
							onClick={() => {
								onDownloadFile(contextMenu.fileNode.path);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Download
						</button>
						<div className='border-t border-gray-700 my-1' />
						<button
							onClick={() => {
								if (onGitStage) onGitStage(contextMenu.fileNode.path);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Stage (Git)
						</button>
						<button
							onClick={() => {
								if (onGitCommit) onGitCommit(contextMenu.fileNode.path);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Commit (Git)
						</button>
						<button
							onClick={() => {
								if (onGitRevert) onGitRevert(contextMenu.fileNode.path);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Revert Git
						</button>
					</>
				) : (
					// Folder menu
					<>
						<button
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
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							New File
						</button>
						<button
							onClick={() => {
								onCreateFolder(contextMenu.folderPath);
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							New Folder
						</button>
						<button
							onClick={() => {
								onSetRenamingPath(contextMenu.folderPath);
								onSetRenameValue(contextMenu.folderPath.split("/").pop());
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Rename Folder
						</button>
						<button
							onClick={() => {
								// onDeleteFolder will be passed as a prop
								if (onDeleteFolder) {
									onDeleteFolder(contextMenu.folderPath);
								}
								onClose();
							}}
							className='text-left px-2 py-1 hover:bg-gray-800 rounded'
						>
							Delete Folder
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default ContextMenu;
