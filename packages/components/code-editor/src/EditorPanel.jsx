//EditorPanel.jsx
import React, { useEffect, useRef, useMemo } from "react";
import * as monaco from "@monaco-editor/react";
import { parseScript } from "meriyah";
import { outlineAtom } from "../../outlineview/src/outlineAtom";
import { useSetAtom } from "jotai";
import debounce from "lodash/debounce";
import { defaultMonacoOptions } from "./monacoOptions";

// -------- Helper: Extract outline by language + refs --------
const extractOutlineByLanguage = (code, fileName) => {
	if (/\.(js|jsx|ts|tsx)$/i.test(fileName)) {
		try {
			const ast = parseScript(code, { next: true, loc: true });
			const outline = [];
			const counts = {};

			// ---- count identifiers ----
			const countIds = node => {
				if (!node || typeof node !== "object") return;
				if (Array.isArray(node)) return node.forEach(countIds);
				if (node.type === "Identifier") counts[node.name] = (counts[node.name] || 0) + 1;
				for (const key in node) if (!["loc", "start", "end"].includes(key)) countIds(node[key]);
			};
			countIds(ast.body);

			// ---- collect declarations ----
			const walk = node => {
				if (!node || typeof node !== "object") return;
				if (Array.isArray(node)) return node.forEach(walk);

				switch (node.type) {
					case "FunctionDeclaration": {
						const name = node.id?.name || "anonymous";
						outline.push({
							name,
							type: "function",
							line: node.loc.start.line,
							lines: node.loc.end.line - node.loc.start.line + 1,
							refs: counts[name] || 1,
						});
						break;
					}
					case "VariableDeclaration":
						node.declarations?.forEach(decl => {
							if (decl.id?.name) {
								outline.push({
									name: decl.id.name,
									type: "variable",
									line: decl.loc.start.line,
									lines: decl.loc.end?.line ? decl.loc.end.line - decl.loc.start.line + 1 : 1,
									refs: counts[decl.id.name] || 1,
								});
							}
						});
						break;
					case "ClassDeclaration": {
						const name = node.id?.name || "anonymous";
						outline.push({
							name,
							type: "class",
							line: node.loc.start.line,
							lines: node.loc.end.line - node.loc.start.line + 1,
							refs: counts[name] || 1,
						});
						break;
					}
				}
				for (const key in node) if (!["loc", "start", "end"].includes(key)) walk(node[key]);
			};
			walk(ast.body);

			return outline;
		} catch {
			return [];
		}
	}

	if (/\.py$/i.test(fileName)) {
		const outline = [];
		const counts = {};
		const lines = code.split("\n");

		// count identifiers بسيط
		lines.forEach(line => {
			const words = line.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
			words.forEach(w => (counts[w] = (counts[w] || 0) + 1));
		});

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const fnMatch = line.match(/^\s*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
			const classMatch = line.match(/^\s*class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);

			if (fnMatch || classMatch) {
				const name = fnMatch ? fnMatch[1] : classMatch[1];
				const type = fnMatch ? "function" : "class";
				const indent = line.match(/^\s*/)?.[0].length || 0;

				// اكتشف نهاية الـ block بالـ indentation
				let endLine = i;
				for (let j = i + 1; j < lines.length; j++) {
					const currIndent = lines[j].match(/^\s*/)?.[0].length || 0;
					if (lines[j].trim() && currIndent <= indent) break;
					endLine = j;
				}

				outline.push({
					name,
					type,
					line: i + 1,
					lines: endLine - i + 1,
					refs: counts[name] || 1,
				});
			}
		}
		return outline;
	}

	return [];
};

export default function EditorPanel({
	files,
	activeFileName,
	onSelectFile,
	openTabs,
	onChange,
	terminalVisible,
	onCloseTab,
	editorRef,
	glyphMarginSettings,
	modifiedTabs = [],
	themeSettings = { theme: "vs-dark", fontSize: 14 },
}) {
	const setOutline = useSetAtom(outlineAtom);
	const containerRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);
	const breakpointsRef = useRef([]);

	// Breakpoint styles
	useEffect(() => {
		const style = document.createElement("style");
		style.innerHTML = `
      .breakpoint {
        background-color: #ef4444;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-left: 4px;
      }
      .monaco-editor .decorationsOverviewRuler.folding {
        background-color: rgba(255, 215, 0, 0.3);
      }
    `;
		document.head.appendChild(style);
		return () => style.remove();
	}, []);

	// -------- OUTLINE UPDATER --------
	const updateOutline = useMemo(
		() =>
			debounce((code = "", fileName = "") => {
				if (!code.trim()) {
					setOutline([]);
					return;
				}
				setOutline(extractOutlineByLanguage(code, fileName));
			}, 300),
		[setOutline]
	);

	useEffect(() => updateOutline.cancel, [updateOutline]);

	useEffect(() => {
		if (editorRef.current) editorRef.current.layout();
	}, [terminalVisible]);

	useEffect(() => {
		const handleResize = () => {
			if (editorRef.current) editorRef.current.layout();
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		if (activeFile?.content?.trim().length > 0) {
			updateOutline(activeFile.content, activeFile.name);
		}
	}, [activeFileName]);

	// -------- LANGUAGE DETECTION --------
	const detectLanguage = fileName => {
		if (/\.jsx?$/i.test(fileName)) return "javascript";
		if (/\.tsx?$/i.test(fileName)) return "typescript";
		if (/\.py$/i.test(fileName)) return "python";
		return "plaintext";
	};

	return (
		<div
			ref={containerRef}
			className='flex flex-col h-full w-full p-2 bg-gray-900 rounded-lg border border-gray-700'
		>
			{/* Tabs */}
			<div className='flex space-x-2 mb-2 overflow-x-auto'>
				{openTabs.map(name => {
					const file = files.find(f => f.name === name);
					if (!file) return null;
					const isActive = name === activeFileName;
					const isModified = modifiedTabs.includes(name);
					return (
						<div
							key={name}
							className={`flex items-center space-x-1 px-2 py-1 rounded cursor-pointer transition
              ${isActive ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}
              ${isModified ? "border border-yellow-400" : ""}`}
							onClick={() => onSelectFile(name)}
						>
							<span>
								{isModified ? "● " : ""}
								{name}
							</span>
							<button
								onClick={e => {
									e.stopPropagation();
									onCloseTab(name);
								}}
								className='text-sm ml-1 hover:text-red-400'
							>
								✕
							</button>
						</div>
					);
				})}
			</div>

			{/* Editor */}
			<div className='flex-grow rounded overflow-hidden border border-gray-700'>
				<monaco.Editor
					height='100%'
					language={detectLanguage(activeFile?.name || "")}
					value={activeFile?.content || ""}
					theme={themeSettings.theme}
					onChange={value => {
						const content = value ?? "";
						onChange(content);
						updateOutline(content, activeFile?.name || "");
					}}
					onMount={(editor, monacoInstance) => {
						editorRef.current = editor;
						const decorations = breakpointsRef.current;

						// ---- CodeLens لكل العناصر (functions, classes, variables) ----
						["javascript", "typescript", "python", "plaintext"].forEach(lang => {
							monacoInstance.languages.registerCodeLensProvider(lang, {
								provideCodeLenses: model => {
									const fileName = activeFile?.name || "";
									const outline = model.getValue().length
										? extractOutlineByLanguage(model.getValue(), fileName)
										: [];

									const lenses = outline.map(item => ({
										range: {
											startLineNumber: item.line,
											startColumn: 1,
											endLineNumber: item.line,
											endColumn: 1,
										},
										id: `${item.type}-${item.name}-${item.line}`,
										command: {
											id: "outline.jumpTo",
											title: `💡 ${item.type} ${item.name} (${item.refs} refs, ${item.lines} lines)`,
											arguments: [{ range: { startLineNumber: item.line } }],
										},
									}));

									return { lenses, dispose: () => {} };
								},
								resolveCodeLens: (model, codeLens) => codeLens,
							});
						});

						// Command لتنفيذ الـ CodeLens
						editor.addCommand(
							0,
							(ctx, args) => {
								if (args?.range) {
									editor.revealLineInCenter(args.range.startLineNumber);
									editor.setPosition({
										lineNumber: args.range.startLineNumber,
										column: 1,
									});
									editor.focus();
								}
							},
							"outline.jumpTo"
						);

						// ---- Breakpoints & external links ----
						editor.onMouseDown(e => {
							if (
								e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
								glyphMarginSettings.enabled
							) {
								const lineNumber = e.target.position.lineNumber;
								const existing = decorations.find(d => d.lineNumber === lineNumber);
								if (existing) {
									editor.deltaDecorations([existing.id], []);
									decorations.splice(decorations.indexOf(existing), 1);
								} else {
									const [id] = editor.deltaDecorations(
										[],
										[
											{
												range: new monacoInstance.Range(lineNumber, 1, lineNumber, 1),
												options: {
													glyphMarginClassName: "breakpoint",
													glyphMarginHoverMessage: {
														value: `Breakpoint at line ${lineNumber}`,
													},
												},
											},
										]
									);
									decorations.push({ id, lineNumber });
								}
							}

							if (e.target?.element?.tagName === "A") {
								const href = e.target.element.getAttribute("href");
								if (href?.startsWith("http")) {
									e.event.preventDefault();
									window.open(href, "_blank");
								}
							}
						});
					}}
					options={{
						...defaultMonacoOptions,
						fontSize: themeSettings.fontSize,
						fontFamily: themeSettings.fontFamily,
						glyphMargin: glyphMarginSettings.enabled,
					}}
				/>
			</div>
		</div>
	);
}
