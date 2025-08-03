// AutoSaveSettings.jsx
import React, { useState, useEffect } from "react";

export default function AutoSaveSettings({ enabled, interval, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);
	const [saveInterval, setSaveInterval] = useState(interval);

	useEffect(() => {
		onChange({ enabled: isEnabled, interval: saveInterval });
	}, [isEnabled, saveInterval]);

	return (
		<div className='p-4 bg-gray-800 text-white rounded shadow space-y-3'>
			<h2 className='text-lg font-bold'>Auto Save Settings</h2>

			<div className='flex items-center space-x-2'>
				<input type='checkbox' checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
				<span>Enable Auto Save</span>
			</div>

			<div className='flex items-center space-x-2'>
				<label className='text-sm text-gray-300'>Save every:</label>
				<input
					type='number'
					min={1}
					value={saveInterval}
					onChange={e => setSaveInterval(Number(e.target.value))}
					className='w-16 p-1 rounded text-black'
				/>
				<span>seconds</span>
			</div>
		</div>
	);
}
