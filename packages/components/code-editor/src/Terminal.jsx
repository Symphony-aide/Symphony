//Terminal.jsx
import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function TerminalComponent() {
	const terminalRef = useRef(null);
	const term = useRef(null);
	const fitAddon = useRef(null);

	useEffect(() => {
		term.current = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			theme: { background: "#1e1e1e", foreground: "#ffffff" },
			scrollback: 1000,
		});
		fitAddon.current = new FitAddon();

		if (terminalRef.current) {
			term.current.loadAddon(fitAddon.current);
			term.current.open(terminalRef.current);
			fitAddon.current.fit();

			// ترحيب بسيط فقط
			term.current.writeln("Welcome to the Terminal!");
			term.current.writeln("This is a placeholder. Functionality coming soon!");
		}

		const handleResize = () => fitAddon.current?.fit();
		window.addEventListener("resize", handleResize);

		return () => {
			term.current?.dispose();
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<div
			ref={terminalRef}
			className='bg-black rounded-lg border border-gray-700 h-[200px] w-full overflow-hidden'
		/>
	);
}
