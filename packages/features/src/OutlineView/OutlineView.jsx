//OutlineView.jsx
import React from "react";
import { useAtomValue } from "jotai";
import { outlineAtom } from "./outlineAtom";

export default function OutlineView({ onSelectItem }) {
	const outline = useAtomValue(outlineAtom);

	return (
		<div className='p-2 bg-gray-900 text-white border-l border-gray-700 h-full overflow-auto'>
			<h2 className='text-lg font-bold mb-2'>Outline</h2>
			{outline.length === 0 ? (
				<p className='text-sm text-gray-400'>No symbols found.</p>
			) : (
				<ul className='space-y-1'>
					{outline.map((item, idx) => (
						<li
							key={idx}
							className='text-sm cursor-pointer hover:bg-gray-800 px-2 py-1 rounded'
							onClick={() => onSelectItem?.(item)}
						>
							<span className='font-mono text-yellow-400'>{item.type}</span>{" "}
							<span className='text-blue-300'>{item.name}</span>{" "}
							<span className='text-gray-500'>@ line {item.line}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
