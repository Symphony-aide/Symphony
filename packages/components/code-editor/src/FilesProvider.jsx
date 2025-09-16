//FilesProvider.jsx
import React, { createContext, useContext } from "react";
import useUndo from "use-undo";
import { storageService } from "./utils/storageService.js";

const FilesContext = createContext();

export function FilesProvider({ children }) {
	const [filesState, { set: setFiles, undo, redo, canUndo, canRedo }] = useUndo(
		storageService.getSync("files") || []
	);

	const files = filesState.present;

	return (
		<FilesContext.Provider value={{ files, setFiles, undo, redo, canUndo, canRedo }}>
			{children}
		</FilesContext.Provider>
	);
}

export function useFiles() {
	return useContext(FilesContext);
}
