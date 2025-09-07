// TabCompletionSettings.jsx
import React, { useState, useEffect } from "react";

export default function TabCompletionSettings({ enabled, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);

	useEffect(() => {
		onChange({ enabled: isEnabled });
	}, [isEnabled]);

	return (
		<div className='p-4 bg-gray-800 text-white rounded shadow space-y-3'>
			<h2 className='text-lg font-bold'>Tab Completion Settings</h2>

			<div className='flex items-center space-x-2'>
				<input type='checkbox' checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
				<span>Enable Tab Completion</span>
			</div>

			<p className='text-sm text-gray-400'>When enabled, pressing Tab will auto-complete code suggestions.</p>
		</div>
	);
}
