// useFolderOperations.js
import { useState, useEffect } from "react";

export const useFolderOperations = (files, onRenameFile, onDeleteFile) => {
	// User-created folders state
	const [userFolders, setUserFolders] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem("explorer.userFolders")) || [];
		} catch {
			return [];
		}
	});

	// Expanded folders state
	const [expanded, setExpanded] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem("explorer.expanded")) || {};
		} catch {
			return {};
		}
	});

	// Persist userFolders to localStorage
	useEffect(() => {
		localStorage.setItem("explorer.userFolders", JSON.stringify(userFolders));
	}, [userFolders]);

	// Persist expanded state to localStorage
	useEffect(() => {
		localStorage.setItem("explorer.expanded", JSON.stringify(expanded));
	}, [expanded]);

	const toggleExpand = path => {
		setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
	};

	const createFolder = (parentPath = "") => {
		const name = prompt("New folder name:");
		if (!name) return;
		const cleanParent = parentPath.replace(/\/$/, "");
		const full = cleanParent ? `${cleanParent}/${name}` : name;
		if (userFolders.includes(full)) return;
		setUserFolders(prev => Array.from(new Set([...prev, full])));
		// Auto-expand the new folder and its parent
		setExpanded(prev => ({ ...prev, [cleanParent]: true, [full]: true }));
	};

	const renameFolder = (folderPath, newName) => {
		if (!newName || newName === folderPath.split("/").pop()) return;
		const parent = folderPath.includes("/") ? folderPath.slice(0, folderPath.lastIndexOf("/")) : "";
		const newPath = parent ? `${parent}/${newName}` : newName;

		// Update files under the folder (rename path prefix)
		const under = (Array.isArray(files) ? files : []).filter(
			f => f.name.startsWith(folderPath + "/") || f.name === folderPath
		);
		under.forEach(f => {
			const rest = f.name.slice(folderPath.length);
			const newFilePath = `${newPath}${rest}`;
			onRenameFile && onRenameFile(f.name, newFilePath);
		});

		// Update userFolders (all subpaths)
		setUserFolders(prev => {
			const next = prev.map(p =>
				p === folderPath || p.startsWith(folderPath + "/") ? p.replace(folderPath, newPath) : p
			);
			return Array.from(new Set(next));
		});

		// Preserve expanded state
		setExpanded(prev => {
			const next = {};
			for (const [k, v] of Object.entries(prev)) {
				if (k === folderPath || k.startsWith(folderPath + "/")) next[k.replace(folderPath, newPath)] = v;
				else next[k] = v;
			}
			return next;
		});
	};

	const deleteFolder = folderPath => {
		if (!confirm(`Delete folder "${folderPath}" and all its files?`)) return;

		// Delete all files under the folder
		(Array.isArray(files) ? files : [])
			.filter(f => f.name === folderPath || f.name.startsWith(folderPath + "/"))
			.forEach(f => onDeleteFile && onDeleteFile(f.name));

		// Remove all subfolders from userFolders
		setUserFolders(prev => prev.filter(p => !(p === folderPath || p.startsWith(folderPath + "/"))));

		// Remove expanded state
		setExpanded(prev => {
			const next = { ...prev };
			Object.keys(next).forEach(k => {
				if (k === folderPath || k.startsWith(folderPath + "/")) delete next[k];
			});
			return next;
		});
	};

	return {
		userFolders,
		expanded,
		toggleExpand,
		createFolder,
		renameFolder,
		deleteFolder,
		setExpanded,
	};
};
