// LayoutManager.jsx
import React, { useState, useEffect, useRef } from "react";
import { Layout, Model } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import { storageService } from "../utils/storageService.js";

const defaultLayoutModel = {
	global: {},
	borders: [],
	layout: {
		type: "row",
		children: [
			{
				type: "column",
				weight: 20,
				children: [
					{
						type: "tabset",
						children: [
							{ type: "tab", name: "Explorer", component: "file-explorer" },
							{ type: "tab", name: "Outline", component: "outline" },
						],
					},
				],
			},
			{
				type: "column",
				weight: 80,
				children: [
					{
						type: "tabset",
						weight: 70,
						children: [{ type: "tab", name: "Editor", component: "editor" }],
					},
					{
						type: "tabset",
						weight: 30,
						children: [{ type: "tab", name: "Terminal", component: "terminal" }],
					},
				],
			},
		],
	},
};

export default function LayoutManager({ factory }) {
	const layoutRef = useRef();
	const savedLayout = storageService.getSync("layoutModel");
	const [model, setModel] = useState(() =>
		savedLayout ? Model.fromJson(savedLayout) : Model.fromJson(defaultLayoutModel)
	);

	// Layout save
	useEffect(() => {
		if (!model || typeof model.toJson !== "function" || typeof model.addListener !== "function") return;
		
		const saveLayout = () => {
			try {
				const json = model.toJson();
				storageService.setSync("layoutModel", json);
			} catch (err) {
				console.error("Failed to save layout:", err);
			}
		};
		
		model.addListener("modelChanged", saveLayout);
		return () => model.removeListener("modelChanged", saveLayout);
	}, [model]);

	const resetLayout = () => {
		storageService.remove("layoutModel");
		const newModel = Model.fromJson(defaultLayoutModel);
		setModel(newModel);
	};

	return (
		<>
			<div className='flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-gray-600 text-sm z-10 relative'>
				<h1 className='text-base font-semibold'>Symphony Editor</h1>
				<div className='flex items-center space-x-2'>
					<button
						className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs'
						onClick={resetLayout}
					>
						Reset Layout
					</button>
				</div>
			</div>
			<div className='flex-1 overflow-hidden relative'>
				<div className='absolute inset-0'>
					<Layout ref={layoutRef} model={model} factory={factory} />
				</div>
			</div>
		</>
	);
}
