import React, { useEffect, useRef, useCallback, useState } from "react";
import * as monaco from "@monaco-editor/react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import hotkeysImport from "hotkeys-js";
import { useAtom } from "jotai";
import { shortcutsAtom } from "./shortcutsAtom.js";
import "@xterm/xterm/css/xterm.css";

const hotkeys = hotkeysImport;

export default function Editor({ initialCode = "", language = "javascript", theme = "vs-dark", onSave, onRun }) {
	const terminalRef = useRef(null);
	const term = useRef(null);
	const fitAddon = useRef(null);

	// Load saved code from localStorage if exists
	const [code, setCode] = useState(() => {
		return localStorage.getItem("savedCode") ?? initialCode;
	});
	const [shortcuts] = useAtom(shortcutsAtom);

	// Initialize Terminal
	useEffect(() => {
		term.current = new Terminal({
			cursorBlink: true,
			fontSize: 14,
			theme: { background: "#1e1e1e" },
		});
		fitAddon.current = new FitAddon();

		if (terminalRef.current) {
			term.current.loadAddon(fitAddon.current);
			term.current.open(terminalRef.current);
			fitAddon.current.fit();
			term.current.writeln("Welcome to the embedded terminal!");
		}

		term.current?.onData(data => {
			term.current?.write(`\r\nYou typed: ${data}`);
		});

		return () => term.current?.dispose();
	}, []);

	// Resize terminal on window resize
	useEffect(() => {
		const handleResize = () => fitAddon.current?.fit();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Handle ALL Hotkeys
	useEffect(() => {
		// Bind all
		Object.entries(shortcuts).forEach(([action, shortcut]) => {
			if (!shortcut) return;
			hotkeys(shortcut, event => {
				event.preventDefault();
				console.log(`Triggered action: ${action}`);

				if (action === "save") {
					onSave?.(code);
					localStorage.setItem("savedCode", code);
					term.current?.writeln("\r\nCode saved!");
				} else if (action === "run") {
					onRun?.(code);

					try {
						const result = eval(code);
						term.current?.writeln(`\r\n> ${result}`);
					} catch (err) {
						term.current?.writeln(`\r\nError: ${err}`);
					}
				}
			});
		});

		// Unbind on cleanup
		return () => {
			Object.values(shortcuts).forEach(shortcut => hotkeys.unbind(shortcut));
		};
	}, [shortcuts, code, onSave, onRun]);

	// Editor change handler
	const handleEditorChange = useCallback(value => {
		setCode(value ?? "");
	}, []);

	return (
		<div className='flex flex-col h-full w-full p-2 bg-gray-900 rounded-lg border border-gray-700'>
			<div className='flex-grow mb-2 rounded overflow-hidden border border-gray-700'>
				<monaco.Editor
					height='300px'
					defaultLanguage={language}
					value={code}
					theme={theme}
					onChange={handleEditorChange}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
					}}
				/>
			</div>
			<div ref={terminalRef} className='h-[150px] bg-black rounded overflow-hidden border border-gray-700' />
		</div>
	);
}
