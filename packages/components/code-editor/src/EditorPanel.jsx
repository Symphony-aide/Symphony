//EditorPanel.jsx
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
}) {
	const setOutline = useSetAtom(outlineAtom);
	const containerRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);

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
			activeFile.content.trim().length > 0 // ✅ هنا التعديل المهم
		) {
			updateOutline(activeFile.content);
		}
	}, [activeFileName]);

	return (
		<div
			ref={containerRef}
			className='flex flex-col h-full w-full p-2 bg-gray-900 rounded-lg border border-gray-700'
		>
			<div className='flex space-x-2 mb-2 overflow-x-auto'>
				{openTabs.map(name => {
					const file = files.find(f => f.name === name);
					if (!file) return null;

					return (
						<div
							key={name}
							className={`flex items-center space-x-1 px-2 py-1 rounded cursor-pointer ${
								name === activeFileName
									? "bg-gray-700 text-white"
									: "bg-gray-800 text-gray-300 hover:bg-gray-700"
							}`}
							onClick={() => onSelectFile(name)}
						>
							<span>{name}</span>
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

			<div className='flex-grow rounded overflow-hidden border border-gray-700'>
				<monaco.Editor
					height='100%'
					defaultLanguage='javascript'
					value={activeFile?.content || ""}
					theme='vs-dark'
					onChange={value => {
						const content = value ?? "";
						onChange(content);
						updateOutline(content);
					}}
					onMount={editor => {
						editorRef.current = editor;
					}}
					options={{
						minimap: { enabled: false },
						fontSize: 14,
						automaticLayout: true,
					}}
				/>
			</div>
		</div>
	);
}
