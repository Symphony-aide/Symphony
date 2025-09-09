// useFileTree.jsx
import { useMemo, useCallback } from "react";

export const useFileTree = (files, userFolders, modifiedTabs, gitStatusMap) => {
	// Helper functions
	const getExt = name => {
		if (typeof name !== "string") return "no-ext";
		const i = name.lastIndexOf(".");
		return i === -1 ? "no-ext" : name.slice(i + 1).toLowerCase();
	};

	const getSizeKB = file => Math.ceil((file?.content?.length || 0) / 1024);

	const getStatus = file => {
		const fromGit = gitStatusMap[file.name];
		if (fromGit) return fromGit;
		if (modifiedTabs.includes(file.name)) return "modified";
		return "clean";
	};

	const matchSize = (kb, sizeFilter) => {
		if (sizeFilter === "all") return true;
		if (sizeFilter === "tiny") return kb < 1;
		if (sizeFilter === "small") return kb >= 1 && kb <= 10;
		if (sizeFilter === "medium") return kb > 10 && kb <= 100;
		if (sizeFilter === "large") return kb > 100;
		return true;
	};

	// Status badge component
	const statusBadge = status => {
		const base = "inline-block px-1.5 py-0.5 rounded text-[10px] ml-2";
		if (status === "modified") return <span className={`${base} bg-yellow-600/30 text-yellow-300`}>M</span>;
		if (status === "untracked") return <span className={`${base} bg-blue-600/30 text-blue-300`}>U</span>;
		if (status === "staged") return <span className={`${base} bg-green-600/30 text-green-300`}>S</span>;
		if (status === "committed") return <span className={`${base} bg-gray-600/30 text-gray-300`}>✓</span>;
		return <span className={`${base} bg-gray-600/30 text-gray-300`}>C</span>;
	};

	// Build tree from files + folders
	const tree = useMemo(() => {
		const root = { type: "folder", name: "", path: "", children: new Map() };

		// Helper to ensure folder exists in tree
		const ensureFolder = folderPath => {
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
				path: folderPath ? `${folderPath}/${fileName}` : fileName,
				fileRef: file,
			});
		}

		return root;
	}, [files, userFolders]);

	// All extensions for filter dropdown
	const allExtensions = useMemo(() => {
		const set = new Set((Array.isArray(files) ? files : []).map(f => getExt(f?.name || "")));
		return ["all", ...Array.from(set).sort()];
	}, [files]);

	// All statuses for filter dropdown
	const allStatuses = useMemo(() => {
		const set = new Set((Array.isArray(files) ? files : []).map(f => getStatus(f)));
		return ["all", ...Array.from(set).sort()];
	}, [files, modifiedTabs, gitStatusMap]);

	// File filter function
	const fileMatchesFilters = useCallback(
		(fileNode, extFilter, sizeFilter, statusFilter, searchTerm) => {
			const file = fileNode.fileRef;
			const name = file?.name || "";
			const extOk = extFilter === "all" || getExt(name) === extFilter;
			const sizeOk = matchSize(getSizeKB(file), sizeFilter);
			const stat = getStatus(file);
			const statusOk = statusFilter === "all" || stat === statusFilter;
			const searchOk = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
			return extOk && sizeOk && statusOk && searchOk;
		},
		[files]
	);

	// Sort children function
	const sortChildren = useCallback(
		(childrenMap, sortBy) => {
			const arr = Array.from(childrenMap.values());
			arr.sort((a, b) => {
				if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
				if (sortBy === "name") return a.name.localeCompare(b.name);
				if (sortBy === "size") {
					if (a.type === "folder" && b.type === "folder") return a.name.localeCompare(b.name);
					if (a.type === "folder") return -1;
					if (b.type === "folder") return 1;
					return getSizeKB(a.fileRef) - getSizeKB(b.fileRef);
				}
				if (sortBy === "status") {
					if (a.type === "folder" && b.type === "folder") return a.name.localeCompare(b.name);
					if (a.type === "folder") return -1;
					if (b.type === "folder") return 1;
					return getStatus(a.fileRef).localeCompare(getStatus(b.fileRef));
				}
				return 0;
			});
			return arr;
		},
		[files]
	);

	// Filter tree recursively
	const filterTree = useCallback(
		(node, extFilter, sizeFilter, statusFilter, searchTerm) => {
			if (node.type === "file") {
				return fileMatchesFilters(node, extFilter, sizeFilter, statusFilter, searchTerm) ? node : null;
			}
			// folder
			const newChildren = new Map();
			for (const child of node.children.values()) {
				const filtered = filterTree(child, extFilter, sizeFilter, statusFilter, searchTerm);
				if (filtered) {
					newChildren.set(filtered.name, filtered);
				}
			}
			if (newChildren.size === 0 && !userFolders.includes(node.path)) {
				// Hide empty folders that weren't created by user
				return null;
			}
			return { ...node, children: newChildren };
		},
		[fileMatchesFilters, userFolders]
	);

	// Visible files for search tab (flat list)
	const getVisibleFilesFlat = useCallback(
		(extFilter, sizeFilter, statusFilter, sortBy, searchTerm) => {
			if (!Array.isArray(files)) return [];
			let arr = files.filter(file => {
				const name = file?.name || "";
				const extOk = extFilter === "all" || getExt(name) === extFilter;
				const sizeOk = matchSize(getSizeKB(file), sizeFilter);
				const stat = getStatus(file);
				const statusOk = statusFilter === "all" || stat === statusFilter;
				const searchOk = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());
				return extOk && sizeOk && statusOk && searchOk;
			});

			if (sortBy === "name") arr.sort((a, b) => (a.name > b.name ? 1 : -1));
			else if (sortBy === "size") arr.sort((a, b) => getSizeKB(a) - getSizeKB(b));
			else if (sortBy === "status") arr.sort((a, b) => (getStatus(a) > getStatus(b) ? 1 : -1));

			return arr;
		},
		[files, modifiedTabs, gitStatusMap]
	);

	return {
		tree,
		allExtensions,
		allStatuses,
		filterTree,
		sortChildren,
		getVisibleFilesFlat,
		getStatus,
		getSizeKB,
		statusBadge,
	};
};
