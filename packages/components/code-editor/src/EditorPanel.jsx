//EditorPanel,jsx
import React, { useEffect, useRef } from "react";
import * as monaco from "@monaco-editor/react";

export default function EditorPanel({
	files,
	activeFileName,
	onSelectFile,
	openTabs,
	onChange,
	terminalVisible,
	onCloseTab,
}) {
	const editorRef = useRef(null);
	const containerRef = useRef(null);
	const activeFile = files.find(f => f.name === activeFileName);

	// Relayout when terminal toggles
	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.layout();
		}
	}, [terminalVisible]);

	// Relayout on window resize
	useEffect(() => {
		const handleResize = () => {
			if (editorRef.current) {
				editorRef.current.layout();
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

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
					onChange={value => onChange(value ?? "")}
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
