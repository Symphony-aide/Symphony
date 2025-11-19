// useTreeBuilder.js
import { useMemo } from "react";

/**
 * Builds a tree structure from files and folders
 * @param {Array} files - Array of file objects
 * @param {Array} userFolders - Array of user-created folder paths
 * @returns {Object} Tree root node
 */
export function useTreeBuilder(files, userFolders) {
	const tree = useMemo(() => {
		const root = { 
			type: "folder", 
			name: "", 
			path: "", 
			children: new Map() 
		};

		// Helper to ensure folder exists in tree
		const ensureFolder = (folderPath) => {
			const parts = folderPath.split("/").filter(Boolean);
			let curr = root;
			let acc = "";
			
			for (const p of parts) {
				acc = acc ? `${acc}/${p}` : p;
				if (!curr.children.has(p)) {
					curr.children.set(p, {
						type: "folder",
						name: p,
						path: acc,
						children: new Map(),
						__userCreated: userFolders.includes(acc),
					});
				}
				curr = curr.children.get(p);
			}
			return curr;
		};

		// Add user folders (even if empty)
		for (const f of userFolders) {
			ensureFolder(f);
		}

		// Add files based on their path
		for (const file of Array.isArray(files) ? files : []) {
			const full = file.name;
			const parts = full.split("/");
			const fileName = parts.pop();
			const folderPath = parts.join("/");
			const parent = folderPath ? ensureFolder(folderPath) : root;

			parent.children.set(fileName, {
				type: "file",
				name: fileName,
				path: full,
				file,
			});
		}

		return root;
	}, [files, userFolders]);

	return tree;
}
