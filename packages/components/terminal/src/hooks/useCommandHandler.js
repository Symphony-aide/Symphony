// useCommandHandler.js - Hook for command processing and history management
import { useRef } from "react";
import { executeCommand, getAutocompleteSuggestion } from "../utils/commands";

export function useCommandHandler() {
	const history = useRef([]);
	const historyIndex = useRef(-1);

	const handleCommand = (command, terminal) => {
		const trimmedCommand = command.trim();
		
		if (!trimmedCommand) {
			terminal.writeln("");
			terminal.write("> ");
			return;
		}

		// Special handling for clear command
		if (trimmedCommand === "clear") {
			// Clear current line completely before execution
			terminal.write("\x1b[2K\r");
			executeCommand(trimmedCommand, terminal);
			// Add to history
			history.current.push(trimmedCommand);
			historyIndex.current = history.current.length;
			return;
		}

		// For other commands, move to new line first then execute
		terminal.write("\r\n");
		executeCommand(trimmedCommand, terminal);
		terminal.write("> ");

		// Add to history
		history.current.push(trimmedCommand);
		historyIndex.current = history.current.length;
	};

	const handleAutocomplete = (buffer) => {
		return getAutocompleteSuggestion(buffer);
	};

	const getHistoryCommand = (direction) => {
		if (direction === "up" && historyIndex.current > 0) {
			historyIndex.current--;
			return history.current[historyIndex.current] || "";
		} else if (direction === "down") {
			if (historyIndex.current < history.current.length - 1) {
				historyIndex.current++;
				return history.current[historyIndex.current] || "";
			} else {
				historyIndex.current = history.current.length;
				return "";
			}
		}
		return null;
	};

	return {
		handleCommand,
		handleAutocomplete,
		getHistoryCommand,
	};
}
