//ShortcutSettingsModal.jsx
import React, { useState } from "react";
import { Input, Button, Flex, Text, Box } from "ui";

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
		<Flex direction="column" gap={3}>
			{localShortcuts.map((item, index) => (
				<Flex key={item.operation || index} justify="between" align="center">
					<Text className='text-sm capitalize text-slate-300'>
						{item.operation?.replace(/([A-Z])/g, ' $1') || `Shortcut ${index}`}
					</Text>
					<Input
						type='text'
						value={item.shortcut || ''}
						onChange={e => handleShortcutChange(index, e.target.value)}
						className='bg-slate-700 border-slate-600 text-black w-32'
						placeholder='e.g., Ctrl+S'
						size="sm"
					/>
				</Flex>
			))}

			<Flex justify="end" gap={2} className='mt-4'>
				<Button onClick={onClose} variant="secondary" size="sm" className='bg-slate-600 hover:bg-slate-500'>
					Close
				</Button>
				<Button onClick={handleSave} className='bg-indigo-600 hover:bg-indigo-500' size="sm">
					Save
				</Button>
			</Flex>
		</Flex>
	);
}
