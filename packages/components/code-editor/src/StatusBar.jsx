//StatusBar.jsx
import React from "react";

export default function StatusBar({ activeFileName, saved, terminalVisible, onToggleTerminal }) {
	return (
		<div className='bg-gray-800 text-gray-300 px-4 py-2 text-sm flex justify-between items-center border-t border-gray-700'>
			<div>{activeFileName ? `${activeFileName} ${saved ? "(Saved)" : "(Unsaved)"}` : "No file selected"}</div>

			<button
				onClick={onToggleTerminal}
				className='text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition'
			>
				{terminalVisible ? "Hide Terminal" : "Show Terminal"}
			</button>
		</div>
	);
}
