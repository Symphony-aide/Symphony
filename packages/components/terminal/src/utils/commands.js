// commands.js - Terminal command definitions
export const commandsMap = {
	help: () => "Available commands: help, clear, echo, date",
	clear: (terminal) => {
		// Clear screen completely and print banner then prompt
		terminal.clear();
		terminal.writeln("Welcome to Terminal Commander Pro 🚀");
		terminal.write("> ");
		return "__CLEAR__"; // Special marker for clear command
	},
	echo: (_, args) => args.join(" "),
	date: () => new Date().toString(),
};

export function executeCommand(command, terminal) {
	const parts = command.split(" ");
	const base = parts[0];
	const args = parts.slice(1);

	if (commandsMap[base]) {
		const result = commandsMap[base](terminal, args);
		// If handler returns something other than clear marker, print it as separate line
		if (result && result !== "__CLEAR__") {
			terminal.writeln(result);
		}
		return result;
	} else {
		terminal.writeln(`Command not found: ${base}`);
		return null;
	}
}

export function getAutocompleteSuggestion(buffer) {
	if (!buffer) return null;
	const matches = Object.keys(commandsMap).filter(c => c.startsWith(buffer));
	return matches.length === 1 ? matches[0] : null;
}
