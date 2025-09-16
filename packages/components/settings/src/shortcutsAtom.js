// shortcutsAtom.js
import { atom } from "jotai";
import { storageService } from "./utils/storageService.js";

const savedShortcuts = storageService.getSync("shortcuts") || [];

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
