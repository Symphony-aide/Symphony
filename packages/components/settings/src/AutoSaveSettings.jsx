// AutoSaveSettings.jsx
import React, { useState, useEffect } from "react";
import { Checkbox, Input, Label, Card, Flex, Heading, Text } from "ui";

export default function AutoSaveSettings({ enabled, interval, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);
	const [saveInterval, setSaveInterval] = useState(interval);

	useEffect(() => {
		onChange({ enabled: isEnabled, interval: saveInterval });
	}, [isEnabled, saveInterval]);

	return (
		<Card className='p-4 bg-slate-800 text-white space-y-3'>
			<Heading level={2} className='text-lg font-bold'>Auto Save Settings</Heading>

			<Flex align="center" gap={2}>
				<Checkbox 
					checked={isEnabled} 
					onCheckedChange={setIsEnabled}
					className='border-slate-600'
				/>
				<Label>Enable Auto Save</Label>
			</Flex>

			<Flex align="center" gap={2}>
				<Label className='text-sm text-slate-300'>Save every:</Label>
				<Input
					type='number'
					min={1}
					value={saveInterval}
					onChange={e => setSaveInterval(Number(e.target.value))}
					className='w-16 bg-slate-700 border-slate-600 text-black !text-black'
					style={{ color: 'black' }}
				/>
				<Text>seconds</Text>
			</Flex>
		</Card>
	);
}
