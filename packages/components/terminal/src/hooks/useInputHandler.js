// useInputHandler.js - Hook for keyboard input handling and autocomplete
import { useRef } from "react";

export function useInputHandler(terminal, commandHandler) {
	const buffer = useRef("");

	const replaceLine = (newBuffer) => {
		// Clear current line and print prompt with new content
		terminal.write("\x1b[2K\r> " + newBuffer);
	};

	const handleData = (data) => {
		const code = data.charCodeAt(0);

		if (code === 13) {
			// Enter key
			const command = buffer.current.trim();
			commandHandler.handleCommand(command, terminal);
			buffer.current = "";
		} else if (code === 127) {
			// Backspace
			if (buffer.current.length > 0) {
				buffer.current = buffer.current.slice(0, -1);
				terminal.write("\b \b");
			}
		} else if (code === 9) {
			// Tab => autocomplete
			const suggestion = commandHandler.handleAutocomplete(buffer.current);
			if (suggestion) {
				terminal.write(suggestion.slice(buffer.current.length));
				buffer.current = suggestion;
			}
		} else if (code === 27) {
			// Arrow keys / escape sequences
			if (data === "\x1b[A") {
				// Up arrow - history back
				const historyCommand = commandHandler.getHistoryCommand("up");
				if (historyCommand !== null) {
					buffer.current = historyCommand;
					replaceLine(buffer.current);
				}
			} else if (data === "\x1b[B") {
				// Down arrow - history forward
				const historyCommand = commandHandler.getHistoryCommand("down");
				if (historyCommand !== null) {
					buffer.current = historyCommand;
					replaceLine(buffer.current);
				}
			}
		} else {
			// Regular text
			buffer.current += data;
			terminal.write(data);
		}
	};

	return {
		handleData,
		getCurrentBuffer: () => buffer.current,
	};
}
