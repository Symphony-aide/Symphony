// TabCompletionSettings.jsx
import React, { useState, useEffect } from "react";
import { Checkbox, Label, Card } from "ui";

export default function TabCompletionSettings({ enabled, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);

	useEffect(() => {
		onChange({ enabled: isEnabled });
	}, [isEnabled]);

	return (
		<Card className='p-4 bg-slate-800 text-white space-y-3'>
			<h2 className='text-lg font-bold'>Tab Completion Settings</h2>

			<div className='flex items-center space-x-2'>
				<Checkbox 
					checked={isEnabled} 
					onCheckedChange={setIsEnabled}
					className='border-slate-600'
				/>
				<Label>Enable Tab Completion</Label>
			</div>

			<p className='text-sm text-slate-400'>When enabled, pressing Tab will auto-complete code suggestions.</p>
		</Card>
	);
}
