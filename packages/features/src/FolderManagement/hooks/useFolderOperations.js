// useFolderOperations.js
import { useCallback } from "react";

/**
 * Provides folder operation handlers (CRUD operations)
 * @param {Object} params - Folder state and file operations
 * @returns {Object} Folder operation handlers
 */
export function useFolderOperations({
	userFolders,
	setUserFolders,
	expanded,
	setExpanded,
	files,
	onRenameFile,
	onDeleteFile,
}) {
	const toggleExpand = useCallback((path) => {
		setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
	}, [setExpanded]);

	const createFolder = useCallback((parentPath = "") => {
		const name = prompt("New folder name:");
		if (!name) return;
		
		const cleanParent = parentPath.replace(/\/$/, "");
		const full = cleanParent ? `${cleanParent}/${name}` : name;
		
		if (userFolders.includes(full)) {
			alert("A folder with this name already exists!");
			return;
		}
		
		setUserFolders(prev => Array.from(new Set([...prev, full])));
		
		// Auto-expand the new folder and its parent
		setExpanded(prev => ({ 
			...prev, 
			[cleanParent]: true, 
			[full]: true 
		}));
		
		return full;
	}, [userFolders, setUserFolders, setExpanded]);

	const renameFolder = useCallback((folderPath, newName) => {
		if (!newName || newName === folderPath.split("/").pop()) return;
		
		const parent = folderPath.includes("/") 
			? folderPath.slice(0, folderPath.lastIndexOf("/")) 
			: "";
		const newPath = parent ? `${parent}/${newName}` : newName;

		// Update files under the folder (rename path prefix)
		const filesUnderFolder = (Array.isArray(files) ? files : []).filter(
			f => f.name.startsWith(folderPath + "/") || f.name === folderPath
		);
		
		filesUnderFolder.forEach(f => {
			const rest = f.name.slice(folderPath.length);
			const newFilePath = `${newPath}${rest}`;
			onRenameFile && onRenameFile(f.name, newFilePath);
		});

		// Update userFolders (all subpaths)
		setUserFolders(prev => {
			const next = prev.map(p =>
				p === folderPath || p.startsWith(folderPath + "/") 
					? p.replace(folderPath, newPath) 
					: p
			);
			return Array.from(new Set(next));
		});

		// Preserve expanded state
		setExpanded(prev => {
			const next = {};
			for (const [k, v] of Object.entries(prev)) {
				if (k === folderPath || k.startsWith(folderPath + "/")) {
					next[k.replace(folderPath, newPath)] = v;
				} else {
					next[k] = v;
				}
			}
			return next;
		});
	}, [files, onRenameFile, setUserFolders, setExpanded]);

	const deleteFolder = useCallback((folderPath) => {
		if (!confirm(`Delete folder "${folderPath}" and all its files?`)) return;

		// Delete all files under the folder
		(Array.isArray(files) ? files : [])
			.filter(f => f.name === folderPath || f.name.startsWith(folderPath + "/"))
			.forEach(f => onDeleteFile && onDeleteFile(f.name));

		// Remove all subfolders from userFolders
		setUserFolders(prev => 
			prev.filter(p => !(p === folderPath || p.startsWith(folderPath + "/")))
		);

		// Remove expanded state
		setExpanded(prev => {
			const next = { ...prev };
			Object.keys(next).forEach(k => {
				if (k === folderPath || k.startsWith(folderPath + "/")) {
					delete next[k];
				}
			});
			return next;
		});
	}, [files, onDeleteFile, setUserFolders, setExpanded]);

	const expandFolder = useCallback((path) => {
		setExpanded(prev => ({ ...prev, [path]: true }));
	}, [setExpanded]);

	const collapseFolder = useCallback((path) => {
		setExpanded(prev => ({ ...prev, [path]: false }));
	}, [setExpanded]);

	const expandAll = useCallback(() => {
		const allPaths = {};
		userFolders.forEach(folder => {
			allPaths[folder] = true;
		});
		setExpanded(allPaths);
	}, [userFolders, setExpanded]);

	const collapseAll = useCallback(() => {
		setExpanded({});
	}, [setExpanded]);

	return {
		toggleExpand,
		createFolder,
		renameFolder,
		deleteFolder,
		expandFolder,
		collapseFolder,
		expandAll,
		collapseAll,
	};
}
