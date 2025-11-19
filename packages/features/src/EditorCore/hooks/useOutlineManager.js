// useOutlineManager.js
import { useRef } from "react";
import { useSetAtom } from "jotai";
import debounce from "lodash.debounce";
import { outlineAtom } from "../../../outlineview/src/outlineAtom";

export function useOutlineManager() {
	const setOutline = useSetAtom(outlineAtom);
	const editorRef = useRef(null);

	const updateOutline = debounce(content => {
		try {
			const outline = [];
			const lines = content.split("\n");
			lines.forEach((line, index) => {
				const funcMatch = line.match(/^\s*function\s+(\w+)/);
				const varMatch = line.match(/^\s*(const|let|var)\s+(\w+)/);
				if (funcMatch) outline.push({ label: funcMatch[1], line: index + 1 });
				else if (varMatch) outline.push({ label: varMatch[2], line: index + 1 });
			});
			setOutline(outline);
		} catch (err) {
			console.error("Outline parse error", err);
		}
	}, 300);

	const handleGoToOutlineItem = item => {
		if (!editorRef.current) return;
		const editor = editorRef.current;
		const model = editor.getModel();
		if (!model) return;
		let position;
		if (item.start !== undefined) position = model.getPositionAt(item.start);
		else if (item.line) position = { lineNumber: item.line, column: 1 };
		if (position) {
			editor.revealPositionInCenter(position);
			editor.setPosition(position);
			editor.focus();
		}
	};

	return {
		editorRef,
		updateOutline,
		handleGoToOutlineItem,
	};
}
