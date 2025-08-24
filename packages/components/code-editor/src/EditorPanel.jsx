// EditorPanel.jsx
import React, { useEffect, useRef, useMemo } from "react";
import * as monaco from "@monaco-editor/react";
import { parseScript } from "meriyah";
import { outlineAtom } from "./outlineAtom";
import { useSetAtom } from "jotai";
import debounce from "lodash/debounce";

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

	// Outline update
	const updateOutline = useMemo(
		() =>
			debounce((code = "") => {
				if (!code.trim()) {
					setOutline([]);
					return;
				}
				try {
					const ast = parseScript(code, { next: true, loc: true });
					const outline = [];

					const walk = node => {
						if (!node || typeof node !== "object") return;
						if (Array.isArray(node)) {
							node.forEach(walk);
							return;
						}

						switch (node.type) {
							case "FunctionDeclaration":
								outline.push({
									name: node.id?.name || "anonymous",
									type: "function",
									start: node.start,
									line: node.loc.start.line,
								});
								break;
							case "VariableDeclaration":
								node.declarations?.forEach(decl => {
									if (decl.id?.name)
										outline.push({
											name: decl.id.name,
											type: "variable",
											start: decl.start,
											line: decl.loc.start.line,
										});
								});
								break;
							case "ClassDeclaration":
								outline.push({
									name: node.id?.name || "anonymous",
									type: "class",
									start: node.start,
									line: node.loc.start.line,
								});
								break;
						}

						for (const key in node) if (!["loc", "start", "end"].includes(key)) walk(node[key]);
					};

					walk(ast.body);
					setOutline(outline);
				} catch {
					setOutline([]);
				}
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
		if (activeFile?.content?.trim().length > 0 && activeFile.name?.toLowerCase().endsWith(".js")) {
			updateOutline(activeFile.content);
		}
	}, [activeFileName]);

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
					defaultLanguage='javascript'
					value={activeFile?.content || ""}
					theme={themeSettings.theme}
					onChange={value => {
						const content = value ?? "";
						onChange(content);
						updateOutline(content);
					}}
					onMount={(editor, monacoInstance) => {
						editorRef.current = editor;
						const decorations = breakpointsRef.current;

						// Codelens Inline + Reference Count + Lines
						try {
							if (activeFile?.name?.toLowerCase().endsWith(".js")) {
								monacoInstance.languages.registerCodeLensProvider("javascript", {
									provideCodeLenses: model => {
										const code = model.getValue();
										const lenses = [];
										try {
											const ast = parseScript(code, { next: true, loc: true });
											const counts = {};

											// Count all identifiers
											const countIdentifiers = node => {
												if (!node || typeof node !== "object") return;
												if (Array.isArray(node)) {
													node.forEach(countIdentifiers);
													return;
												}
												if (node.type === "Identifier")
													counts[node.name] = (counts[node.name] || 0) + 1;
												for (const key in node)
													if (!["loc", "start", "end"].includes(key))
														countIdentifiers(node[key]);
											};
											countIdentifiers(ast.body);

											// Add lenses to declarations
											const addLens = node => {
												if (!node || typeof node !== "object") return;
												if (Array.isArray(node)) {
													node.forEach(addLens);
													return;
												}

												// Function
												if (node.type === "FunctionDeclaration") {
													const name = node.id?.name || "anonymous";
													const line = node.loc.start.line;
													const lines = node.loc.end.line - node.loc.start.line + 1;
													lenses.push({
														range: {
															startLineNumber: line,
															startColumn: 1,
															endLineNumber: line,
															endColumn: 1,
														},
														command: {
															id: "noop",
															title: `💡 ${name} (${counts[name] || 1} refs, ${lines} lines)`,
														},
													});
												}

												// Variable
												if (node.type === "VariableDeclaration") {
													node.declarations?.forEach(decl => {
														const name = decl.id?.name;
														if (!name) return;
														const line = decl.loc.start.line;
														lenses.push({
															range: {
																startLineNumber: line,
																startColumn: 1,
																endLineNumber: line,
																endColumn: 1,
															},
															command: {
																id: "noop",
																title: `💡 ${name} (${counts[name] || 1} refs, 1 line)`,
															},
														});
													});
												}

												// Class
												if (node.type === "ClassDeclaration") {
													const name = node.id?.name || "anonymous";
													const line = node.loc.start.line;
													const lines = node.loc.end.line - node.loc.start.line + 1;
													lenses.push({
														range: {
															startLineNumber: line,
															startColumn: 1,
															endLineNumber: line,
															endColumn: 1,
														},
														command: {
															id: "noop",
															title: `💡 ${name} (${counts[name] || 1} refs, ${lines} lines)`,
														},
													});
												}

												for (const key in node)
													if (!["loc", "start", "end"].includes(key)) addLens(node[key]);
											};
											addLens(ast.body);
										} catch {}
										return { lenses, dispose: () => {} };
									},
									resolveCodeLens: lens => lens,
								});
								monacoInstance.editor.registerCommand("noop", () => {});
							}
						} catch (err) {
							console.warn("Codelens failed:", err);
						}

						// Breakpoints & links
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
						fontSize: themeSettings.fontSize,
						fontFamily: themeSettings.fontFamily,
						cursorBlinking: "smooth",
						cursorSmoothCaretAnimation: true,
						minimap: { enabled: true },
						lineHeight: 20,
						renderWhitespace: "selection",
						automaticLayout: true,
						glyphMargin: glyphMarginSettings.enabled,
						folding: true,
						foldingHighlight: true,
						foldingImportsByDefault: true,
						showFoldingControls: "always",
						links: true,
						multiCursorModifier: "ctrlCmd",
						multiCursorMergeOverlapping: true,
						mouseWheelZoom: true,
						smoothScrolling: true,
						fastScrollSensitivity: 5,
						wordWrap: "on",
						wordBasedSuggestions: true,
						occurrencesHighlight: true,
						selectionHighlight: true,
						matchBrackets: "always",
						autoClosingBrackets: "always",
						autoClosingQuotes: "always",
						autoIndent: "full",
						tabSize: 2,
						insertSpaces: true,
						quickSuggestions: { other: true, comments: false, strings: true },
						parameterHints: { enabled: true },
						hover: { enabled: true },
						suggestOnTriggerCharacters: true,
						acceptSuggestionOnEnter: "on",
						snippetSuggestions: "inline",
						inlineSuggest: { enabled: true },
						gotoLocation: {
							multipleDefinitions: "peek",
							multipleReferences: "peek",
							multipleDeclarations: "peek",
						},
						definitionLinkOpensInPeek: true,
						guides: { bracketPairs: true },
					}}
				/>
			</div>
		</div>
	);
}
