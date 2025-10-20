// AutoSaveSettings.jsx
import React, { useState, useEffect } from "react";
import { Checkbox, Input, Label, Card } from "ui";

export default function AutoSaveSettings({ enabled, interval, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);
	const [saveInterval, setSaveInterval] = useState(interval);

	useEffect(() => {
		onChange({ enabled: isEnabled, interval: saveInterval });
	}, [isEnabled, saveInterval]);

	return (
		<Card className='p-4 bg-slate-800 text-white space-y-3'>
			<h2 className='text-lg font-bold'>Auto Save Settings</h2>

			<div className='flex items-center space-x-2'>
				<Checkbox 
					checked={isEnabled} 
					onCheckedChange={setIsEnabled}
					className='border-slate-600'
				/>
				<Label>Enable Auto Save</Label>
			</div>

			<div className='flex items-center space-x-2'>
				<Label className='text-sm text-slate-300'>Save every:</Label>
				<Input
					type='number'
					min={1}
					value={saveInterval}
					onChange={e => setSaveInterval(Number(e.target.value))}
					className='w-16 bg-slate-700 border-slate-600 text-black !text-black'
					style={{ color: 'black' }}
				/>
				<span>seconds</span>
			</div>
		</Card>
	);
}
