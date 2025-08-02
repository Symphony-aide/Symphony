// shortcutsAtom.js
import { atom } from "jotai";

const savedShortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");

export const shortcutsAtom = atom(
	savedShortcuts.length
		? savedShortcuts
		: [
				{ operation: "save", shortcut: "ctrl+s" },
				{ operation: "run", shortcut: "ctrl+r" },
				{ operation: "format", shortcut: "ctrl+f" },
				{ operation: "toggleTerminal", shortcut: "ctrl+`" },
			]
);
