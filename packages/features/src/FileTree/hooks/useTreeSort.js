// useTreeSort.js
import { useCallback } from "react";

/**
 * Provides tree sorting functionality
 * @returns {Object} Sort functions
 */
export function useTreeSort() {
	const sortChildren = useCallback((children, sortBy) => {
		const arr = Array.from(children.entries());
		
		arr.sort(([, a], [, b]) => {
			// Folders first
			if (a.type === "folder" && b.type === "file") return -1;
			if (a.type === "file" && b.type === "folder") return 1;

			// Then sort by criteria
			if (sortBy === "name") {
				return a.name.localeCompare(b.name);
			} else if (sortBy === "size") {
				const sizeA = a.file?.content?.length || 0;
				const sizeB = b.file?.content?.length || 0;
				return sizeB - sizeA;
			} else if (sortBy === "type") {
				const extA = a.name.split(".").pop() || "";
				const extB = b.name.split(".").pop() || "";
				return extA.localeCompare(extB);
			}
			
			return 0;
		});

		return new Map(arr);
	}, []);

	const getVisibleFilesFlat = useCallback((files, extFilter, sizeFilter, statusFilter, sortBy, searchTerm, modifiedTabs, gitStatusMap, getExt, getSizeKB, matchSize) => {
		let filtered = Array.isArray(files) ? [...files] : [];

		// Apply filters
		if (extFilter !== "all") {
			filtered = filtered.filter(f => getExt(f.name) === extFilter);
		}

		if (sizeFilter !== "all") {
			filtered = filtered.filter(f => matchSize(getSizeKB(f), sizeFilter));
		}

		if (statusFilter !== "all") {
			filtered = filtered.filter(f => {
				const fromGit = gitStatusMap?.[f.name];
				const status = fromGit || (modifiedTabs?.includes(f.name) ? "modified" : "clean");
				return status === statusFilter;
			});
		}

		if (searchTerm) {
			filtered = filtered.filter(f => 
				f.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Sort
		filtered.sort((a, b) => {
			if (sortBy === "name") {
				return a.name.localeCompare(b.name);
			} else if (sortBy === "size") {
				return (b.content?.length || 0) - (a.content?.length || 0);
			} else if (sortBy === "type") {
				const extA = getExt(a.name);
				const extB = getExt(b.name);
				return extA.localeCompare(extB);
			}
			return 0;
		});

		return filtered;
	}, []);

	return {
		sortChildren,
		getVisibleFilesFlat,
	};
}
