//ShortcutSettingsModal.jsx
import React, { useState } from "react";

export default function ShortcutSettingsModal({ onClose, shortcuts, setShortcuts }) {
	const [localShortcuts, setLocalShortcuts] = useState(shortcuts);

	const handleChange = (op, value) => {
		setLocalShortcuts(prev => prev.map(s => (s.operation === op ? { ...s, shortcut: value } : s)));
	};

	const handleSave = () => {
		setShortcuts(localShortcuts);
		localStorage.setItem("shortcuts", JSON.stringify(localShortcuts));
		onClose();
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
			<div className='bg-gray-800 p-6 rounded-lg text-white w-96'>
				<h2 className='text-xl mb-4'>Keyboard Shortcuts Settings</h2>

				{localShortcuts.map(s => (
					<div key={s.operation} className='mb-3'>
						<label className='block mb-1 capitalize'>{s.operation} Shortcut:</label>
						<input
							value={s.shortcut}
							onChange={e => handleChange(s.operation, e.target.value)}
							className='w-full p-2 rounded text-black'
						/>
					</div>
				))}

				<div className='flex justify-end space-x-2 mt-4'>
					<button onClick={handleSave} className='bg-green-600 px-4 py-2 rounded hover:bg-green-500'>
						Save
					</button>
					<button onClick={onClose} className='bg-gray-600 px-4 py-2 rounded hover:bg-gray-500'>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
