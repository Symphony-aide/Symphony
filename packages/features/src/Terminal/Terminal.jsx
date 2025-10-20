// Terminal.jsx
import React from "react";
import "@xterm/xterm/css/xterm.css";
import { useTerminal } from "./hooks/useTerminal";
import { useCommandHandler } from "./hooks/useCommandHandler";
import { useInputHandler } from "./hooks/useInputHandler";

export default function TerminalComponent({ terminalSettings }) {
	const commandHandler = useCommandHandler();
	const { terminalRef, terminal } = useTerminal(terminalSettings);
	const inputHandler = useInputHandler(terminal, commandHandler);

	// Set up data handler after all hooks are initialized
	React.useEffect(() => {
		if (terminal && inputHandler) {
			const dataHandler = (data) => inputHandler.handleData(data);
			terminal.onData(dataHandler);
		}
	}, [terminal, inputHandler]);

	return (
		<div
			ref={terminalRef}
			className='bg-black rounded-lg border border-gray-700 h-[200px] w-full overflow-hidden'
		/>
	);
}
