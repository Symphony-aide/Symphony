//Terminal.jsx
import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function TerminalComponent({ terminalSettings }) {
	const terminalRef = useRef(null);
	const term = useRef(null);
	const fitAddon = useRef(null);

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

			term.current.writeln("Welcome to the Terminal!");
			term.current.write("> "); // زي البروبمت في bash

			let buffer = ""; // نخزن فيه النص اللي بيتكتب

			term.current.onData(data => {
				const code = data.charCodeAt(0);

				if (code === 13) {
					// Enter
					term.current.writeln(""); // ينزل سطر
					handleCommand(buffer);
					buffer = "";
					term.current.write("> "); // البروبمت الجديد
				} else if (code === 127) {
					// Backspace
					if (buffer.length > 0) {
						buffer = buffer.slice(0, -1);
						term.current.write("\b \b"); // يمسح الحرف من الشاشة
					}
				} else {
					// أي كتابة عادية
					buffer += data;
					term.current.write(data);
				}
			});

			function handleCommand(cmd) {
				if (cmd.trim() === "clear") {
					term.current.clear();
				} else if (cmd.trim() === "help") {
					term.current.writeln("Available commands: help, clear");
				} else if (cmd.trim()) {
					term.current.writeln(`You typed: ${cmd}`);
				}
			}
		}

		const handleResize = () => fitAddon.current?.fit();
		window.addEventListener("resize", handleResize);

		return () => {
			term.current?.dispose();
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	// تحديث الإعدادات
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

	return (
		<div
			ref={terminalRef}
			className='bg-black rounded-lg border border-gray-700 h-[200px] w-full overflow-hidden'
		/>
	);
}
