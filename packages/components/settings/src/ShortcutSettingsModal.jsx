//ShortcutSettingsModal.jsx
import React, { useState } from "react";
import { Input } from "ui";
import { Button } from "ui";

export default function ShortcutSettingsModal({ shortcuts, setShortcuts, onClose }) {
	const [localShortcuts, setLocalShortcuts] = useState(shortcuts || []);

	const handleSave = () => {
		setShortcuts(localShortcuts);
		onClose();
	};

	const handleShortcutChange = (index, newShortcut) => {
		setLocalShortcuts(prev => 
			prev.map((item, i) => 
				i === index ? { ...item, shortcut: newShortcut } : item
			)
		);
	};

	return (
		<div className='space-y-3'>
			{localShortcuts.map((item, index) => (
				<div key={item.operation || index} className='flex justify-between items-center'>
					<span className='text-sm capitalize text-slate-300'>
						{item.operation?.replace(/([A-Z])/g, ' $1') || `Shortcut ${index}`}
					</span>
					<Input
						type='text'
						value={item.shortcut || ''}
						onChange={e => handleShortcutChange(index, e.target.value)}
						className='bg-slate-700 border-slate-600 text-black w-32'
						placeholder='e.g., Ctrl+S'
						size="sm"
					/>
				</div>
			))}

			<div className='flex justify-end space-x-2 mt-4'>
				<Button onClick={onClose} variant="secondary" size="sm" className='bg-slate-600 hover:bg-slate-500'>
					Close
				</Button>
				<Button onClick={handleSave} className='bg-indigo-600 hover:bg-indigo-500' size="sm">
					Save
				</Button>
			</div>
		</div>
	);
}
