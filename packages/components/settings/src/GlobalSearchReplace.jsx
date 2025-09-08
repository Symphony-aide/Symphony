//GlobalSearchReplace.jsx
import React, { useState } from "react";

export default function GlobalSearchReplace({ onReplaceAll }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [replaceTerm, setReplaceTerm] = useState("");

	return (
		<div className='p-2 bg-gray-800 border-b border-gray-700 flex items-center space-x-2'>
			<input
				value={searchTerm}
				onChange={e => setSearchTerm(e.target.value)}
				placeholder='Search'
				className='p-1 rounded bg-gray-700 text-white w-40'
			/>
			<input
				value={replaceTerm}
				onChange={e => setReplaceTerm(e.target.value)}
				placeholder='Replace'
				className='p-1 rounded bg-gray-700 text-white w-40'
			/>
			<button
				onClick={() => onReplaceAll(searchTerm, replaceTerm)}
				className='bg-green-600 px-3 py-1 rounded hover:bg-green-500 text-white'
			>
				Replace All
			</button>
		</div>
	);
}
