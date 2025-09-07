//ShortcutSettingsModal.jsx
import React, { useState } from "react";

export default function ShortcutSettingsModal({ shortcuts, setShortcuts, onClose, onSave }) {
	const [localShortcuts, setLocalShortcuts] = useState(shortcuts);

	const handleChangeShortcut = (index, value) => {
		const updated = [...localShortcuts];
		updated[index].shortcut = value;
		setLocalShortcuts(updated);
	};

	const handleSave = () => {
		setShortcuts(localShortcuts); // حفظ التعديلات للأب
		onSave?.(); // نرجع للي بعته SettingsModal
	};

	return (
		<div className='p-4 bg-gray-800 rounded space-y-3'>
			<h2 className='text-lg font-bold mb-2'>Shortcut Settings</h2>

			{localShortcuts.map((item, idx) => (
				<div key={idx} className='flex items-center space-x-2'>
					<span className='w-32'>{item.operation}</span>
					<input
						type='text'
						value={item.shortcut}
						onChange={e => handleChangeShortcut(idx, e.target.value)}
						className='flex-1 p-1 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>
			))}

			<div className='flex justify-end space-x-2 mt-4'>
				<button onClick={onClose} className='bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded'>
					Close
				</button>
				<button onClick={handleSave} className='bg-green-600 hover:bg-green-500 px-3 py-1 rounded'>
					Save
				</button>
			</div>
		</div>
	);
}
