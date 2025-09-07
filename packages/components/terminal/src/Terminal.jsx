// Terminal.jsx
import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function TerminalComponent({ terminalSettings }) {
	const terminalRef = useRef(null);
	const term = useRef(null);
	const fitAddon = useRef(null);

	// history + autocomplete
	const history = useRef([]);
	const historyIndex = useRef(-1);

	const commandsMap = {
		help: () => "Available commands: help, clear, echo, date",
		clear: t => {
			// امسح الشاشة بالكامل واطبع البانر ثم البروبمت
			t.clear();
			t.writeln("Welcome to Terminal Commander Pro 🚀");
			t.write("> ");
			return "__CLEAR__"; // علامة خاصة نقارن بيها بعدين
		},
		echo: (_, args) => args.join(" "),
		date: () => new Date().toString(),
	};

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

			term.current.writeln("Welcome to Terminal Commander Pro 🚀");
			term.current.write("> ");

			let buffer = "";

			term.current.onData(data => {
				// data قد تكون تسلسل أحرف (بما في ذلك تسلسل الهروب)
				const code = data.charCodeAt(0);

				if (code === 13) {
					// Enter
					const command = buffer.trim();

					// لا شيء مكتوب -> فقط سطر جديد وبروبمت جديد
					if (!command) {
						term.current.writeln("");
						term.current.write("> ");
						buffer = "";
						return;
					}

					// لو الأمر clear: امسح السطر الحالي (عشان نمنع echo للأمر)
					if (command === "clear") {
						// امسح السطر الحالي بالكامل (input line) قبل التنفيذ
						term.current.write("\x1b[2K\r");
						const result = handleCommand(command); // clear نفسه يطبع البانر والبروبمت
						// clear handler يرجع "__CLEAR__"؛ ما نضيفش سطر أو بروبمت تاني
						// history
						history.current.push(command);
						historyIndex.current = history.current.length;
						buffer = "";
						return;
					}

					// لأوامر أخرى -> ننتقل لسطر جديد أولًا ثم ننفذ الأمر حتى يظهر الناتج على سطر مستقل
					term.current.write("\r\n");
					handleCommand(command);
					term.current.write("> ");

					history.current.push(command);
					historyIndex.current = history.current.length;
					buffer = "";
				} else if (code === 127) {
					// Backspace
					if (buffer.length > 0) {
						buffer = buffer.slice(0, -1);
						term.current.write("\b \b");
					}
				} else if (code === 9) {
					// Tab => autocomplete
					const suggestion = handleAutocomplete(buffer);
					if (suggestion) {
						term.current.write(suggestion.slice(buffer.length));
						buffer = suggestion;
					}
				} else if (code === 27) {
					// Arrow keys / escape sequences
					// ممكن يصلنا السلسلة كاملة مثل "\x1b[A"
					if (data === "\x1b[A") {
						// history back
						if (historyIndex.current > 0) {
							historyIndex.current--;
							buffer = history.current[historyIndex.current] || "";
							replaceLine(buffer);
						}
					} else if (data === "\x1b[B") {
						// history forward
						if (historyIndex.current < history.current.length - 1) {
							historyIndex.current++;
							buffer = history.current[historyIndex.current] || "";
						} else {
							historyIndex.current = history.current.length;
							buffer = "";
						}
						replaceLine(buffer);
					}
				} else {
					// نص عادي
					buffer += data;
					term.current.write(data);
				}
			});

			function replaceLine(newBuffer) {
				// امسح السطر الحالي واطبع البروبمت مع المحتوى الجديد
				term.current.write("\x1b[2K\r> " + newBuffer);
			}

			function handleCommand(cmd) {
				const parts = cmd.split(" ");
				const base = parts[0];
				const args = parts.slice(1);

				if (commandsMap[base]) {
					const result = commandsMap[base](term.current, args);
					// لو الhandler رجع شيء غير علامة الـ clear نطبعه كسطر مستقل
					if (result && result !== "__CLEAR__") {
						term.current.writeln(result);
					}
					return result;
				} else {
					term.current.writeln(`Command not found: ${base}`);
					return null;
				}
			}

			function handleAutocomplete(buf) {
				if (!buf) return null;
				const matches = Object.keys(commandsMap).filter(c => c.startsWith(buf));
				return matches.length === 1 ? matches[0] : null;
			}
		}

		const handleResize = () => fitAddon.current?.fit();
		window.addEventListener("resize", handleResize);

		return () => {
			term.current?.dispose();
			window.removeEventListener("resize", handleResize);
		};
	}, []); // useEffect init only

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
