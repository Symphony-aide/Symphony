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
	themeSettings = { theme: "vs-dark", fontSize: 14 }, // جديد: ثيم وحجم الخط
}) {
	const setOutline = useSetAtom(outlineAtom);
	const containerRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);

	// breakpoints
	const breakpointsRef = useRef([]);

	// Inject breakpoint style dynamically
	useEffect(() => {
		const style = document.createElement("style");
		style.innerHTML = `
      .breakpoint {
        background-color: #ef4444; /* red-500 */
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-left: 4px;
      }
      /* Folding Highlight */
      .monaco-editor .decorationsOverviewRuler.folding {
        background-color: rgba(255, 215, 0, 0.3); /* gold */
      }
    `;
		document.head.appendChild(style);
		return () => style.remove();
	}, []);

	// Update outline
	const updateOutline = useMemo(
		() =>
			debounce((code = "") => {
				if (!code.trim()) {
					setOutline([]);
					return;
				}

				try {
					const ast = parseScript(code, {
						next: true,
						loc: true,
					});

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
									if (decl.id?.name) {
										outline.push({
											name: decl.id.name,
											type: "variable",
											start: decl.start,
											line: decl.loc.start.line,
										});
									}
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

						for (const key in node) {
							if (key === "loc" || key === "start" || key === "end") continue;
							walk(node[key]);
						}
					};

					walk(ast.body);
					setOutline(outline);
				} catch (err) {
					console.error("Failed to parse code:", err);
					setOutline([]);
				}
			}, 300),
		[setOutline]
	);

	useEffect(() => {
		return () => {
			updateOutline.cancel();
		};
	}, [updateOutline]);

	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.layout();
		}
	}, [terminalVisible]);

	useEffect(() => {
		const handleResize = () => {
			if (editorRef.current) {
				editorRef.current.layout();
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		if (
			activeFile?.content &&
			activeFile.name?.toLowerCase().endsWith(".js") &&
			activeFile.content.trim().length > 0
		) {
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
								${isModified ? "border border-yellow-400" : ""}
							`}
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
					theme={themeSettings.theme} // ← الثيم من الإعدادات
					onChange={value => {
						const content = value ?? "";
						onChange(content);
						updateOutline(content);
					}}
					onMount={(editor, monacoInstance) => {
						editorRef.current = editor;
						const decorations = breakpointsRef.current;

						// ✅ Enable clickable links to open in new tab
						editor.onMouseDown(e => {
							// Handle gutter clicks for breakpoints
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

							// Handle clickable links
							if (e.target?.element?.tagName === "A") {
								const href = e.target.element.getAttribute("href");
								if (href && href.startsWith("http")) {
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
