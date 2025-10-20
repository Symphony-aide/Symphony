//FilesProvider.jsx
import React, { createContext, useContext } from "react";
import { useCommandState } from "@symphony/commands";
import { useEditorCommands } from "./hooks/useEditorCommands.js";

const FilesContext = createContext();

export function FilesProvider({ children }) {
	// Use the new command-based file management
	const { files, setFiles } = useEditorCommands();
	
	// Get undo/redo state from global command system
	const { canUndo, canRedo } = useCommandState();

	return (
		<FilesContext.Provider value={{ files, setFiles, canUndo, canRedo }}>
			{children}
		</FilesContext.Provider>
	);
}

export function useFiles() {
	return useContext(FilesContext);
}
