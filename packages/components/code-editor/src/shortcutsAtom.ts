// shortcutsAtom.js
import { atom } from "jotai";

const savedShortcuts = JSON.parse(localStorage.getItem("shortcuts") || "{}");

export const shortcutsAtom = atom({
	save: savedShortcuts.save || "ctrl+s",
	run: savedShortcuts.run || "ctrl+r",
});
