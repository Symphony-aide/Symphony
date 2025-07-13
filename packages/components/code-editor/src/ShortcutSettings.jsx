import React, { useState } from "react";
import { useAtom } from "jotai";
import { shortcutsAtom } from "./shortcutsAtom.js";

export default function ShortcutSettings() {
	const [shortcuts, setShortcuts] = useAtom(shortcutsAtom);
	const [action, setAction] = useState("save");
	const [shortcut, setShortcut] = useState("");

	const handleAssign = () => {
		if (!shortcut) return;

		const updatedShortcuts = { ...shortcuts, [action]: shortcut };
		setShortcuts(updatedShortcuts);
		localStorage.setItem("shortcuts", JSON.stringify(updatedShortcuts));

		setShortcut("");
	};

	return (
		<div className='p-4 bg-gray-800 text-white rounded'>
			<h2 className='text-lg font-bold mb-2'>Shortcut Settings</h2>
			<label className='block mb-1'>Choose Action:</label>
			<select
				value={action}
				onChange={e => setAction(e.target.value)}
				className='mb-2 p-2 rounded text-black w-full'
			>
				<option value='save'>Save</option>
				<option value='run'>Run</option>
			</select>
			<label className='block mb-1'>Shortcut:</label>
			<input
				placeholder='e.g. ctrl+s'
				value={shortcut}
				onChange={e => setShortcut(e.target.value)}
				className='mb-2 p-2 rounded text-black w-full'
			/>
			<button onClick={handleAssign} className='p-2 bg-blue-600 rounded hover:bg-blue-700 w-full'>
				Assign Shortcut
			</button>
			<div className='mt-4'>
				<h3 className='font-semibold mb-1'>Current Shortcuts:</h3>
				<ul className='list-disc pl-4'>
					{Object.entries(shortcuts).map(([key, value]) => (
						<li key={key}>
							<span className='font-semibold'>{key}:</span> {value}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
