// useTerminal.js - Hook for terminal initialization and settings management
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

export function useTerminal(terminalSettings) {
	const terminalRef = useRef(null);
	const term = useRef(null);
	const fitAddon = useRef(null);

	// Initialize terminal
	useEffect(() => {
		term.current = new Terminal({
			cursorBlink: true,
			fontFamily: terminalSettings.fontFamily,
			fontSize: terminalSettings.fontSize,
			fontWeight: terminalSettings.fontWeight,
			lineHeight: terminalSettings.lineHeight,
			cursorStyle: terminalSettings.cursorStyle,
			theme: { background: "#1e1e1e", foreground: "#ffffff" },
			scrollback: 1000,
		});

		fitAddon.current = new FitAddon();
		term.current.loadAddon(fitAddon.current);

		if (terminalRef.current) {
			term.current.open(terminalRef.current);
			setTimeout(() => fitAddon.current.fit(), 50);

			// Welcome message and initial prompt
			term.current.writeln("Welcome to Terminal Commander Pro 🚀");
			term.current.write("> ");
		}

		const handleResize = () => fitAddon.current?.fit();
		window.addEventListener("resize", handleResize);

		return () => {
			term.current?.dispose();
			window.removeEventListener("resize", handleResize);
		};
	}, []); // Initialize only once

	// Update terminal settings when they change
	useEffect(() => {
		if (term.current) {
			const t = term.current;
			t.options.fontFamily = terminalSettings.fontFamily;
			t.options.fontSize = terminalSettings.fontSize;
			t.options.fontWeight = terminalSettings.fontWeight;
			t.options.lineHeight = terminalSettings.lineHeight;
			t.options.cursorStyle = terminalSettings.cursorStyle;

			fitAddon.current?.fit();
		}
	}, [terminalSettings]);

	return {
		terminalRef,
		terminal: term.current,
		fitAddon: fitAddon.current,
	};
}
