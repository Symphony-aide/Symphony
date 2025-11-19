// useTreeFilter.js
import { useCallback } from "react";

/**
 * Provides tree filtering functionality
 * @returns {Object} Filter functions
 */
export function useTreeFilter() {
	const getExt = useCallback((name) => {
		if (typeof name !== "string") return "no-ext";
		const i = name.lastIndexOf(".");
		return i === -1 ? "no-ext" : name.slice(i + 1).toLowerCase();
	}, []);

	const getSizeKB = useCallback((file) => {
		return Math.ceil((file?.content?.length || 0) / 1024);
	}, []);

	const matchSize = useCallback((kb, sizeFilter) => {
		if (sizeFilter === "all") return true;
		if (sizeFilter === "tiny") return kb < 1;
		if (sizeFilter === "small") return kb >= 1 && kb <= 10;
		if (sizeFilter === "medium") return kb > 10 && kb <= 100;
		if (sizeFilter === "large") return kb > 100;
		return true;
	}, []);

	const filterTree = useCallback((node, extFilter, sizeFilter, statusFilter, searchTerm, modifiedTabs, gitStatusMap) => {
		if (!node) return null;

		if (node.type === "file") {
			const ext = getExt(node.name);
			const kb = getSizeKB(node.file);
			
			// Get status
			const fromGit = gitStatusMap?.[node.path];
			const status = fromGit || (modifiedTabs?.includes(node.path) ? "modified" : "clean");

			// Apply filters
			if (extFilter !== "all" && ext !== extFilter) return null;
			if (!matchSize(kb, sizeFilter)) return null;
			if (statusFilter !== "all" && status !== statusFilter) return null;
			if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) return null;

			return node;
		}

		// For folders, recursively filter children
		const filteredChildren = new Map();
		for (const [key, child] of node.children) {
			const filtered = filterTree(child, extFilter, sizeFilter, statusFilter, searchTerm, modifiedTabs, gitStatusMap);
			if (filtered) {
				filteredChildren.set(key, filtered);
			}
		}

		// Keep folder if it has children or is user-created
		if (filteredChildren.size > 0 || node.__userCreated) {
			return {
				...node,
				children: filteredChildren,
			};
		}

		return null;
	}, [getExt, getSizeKB, matchSize]);

	const getAllExtensions = useCallback((files) => {
		const exts = new Set();
		for (const f of Array.isArray(files) ? files : []) {
			exts.add(getExt(f.name));
		}
		return Array.from(exts).sort();
	}, [getExt]);

	const getAllStatuses = useCallback((files, modifiedTabs, gitStatusMap) => {
		const statuses = new Set();
		for (const f of Array.isArray(files) ? files : []) {
			const fromGit = gitStatusMap?.[f.name];
			const status = fromGit || (modifiedTabs?.includes(f.name) ? "modified" : "clean");
			statuses.add(status);
		}
		return Array.from(statuses).sort();
	}, []);

	return {
		filterTree,
		getAllExtensions,
		getAllStatuses,
		getExt,
		getSizeKB,
		matchSize,
	};
}
