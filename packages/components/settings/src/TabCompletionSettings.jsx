// TabCompletionSettings.jsx
import React, { useState, useEffect } from "react";
import { Checkbox, Label, Card, Flex, Heading, Text } from "ui";

export default function TabCompletionSettings({ enabled, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);

	useEffect(() => {
		onChange({ enabled: isEnabled });
	}, [isEnabled]);

	return (
		<Card className='p-4 bg-slate-800 text-white space-y-3'>
			<Heading level={2} className='text-lg font-bold'>Tab Completion Settings</Heading>

			<Flex align="center" gap={2}>
				<Checkbox 
					checked={isEnabled} 
					onCheckedChange={setIsEnabled}
					className='border-slate-600'
				/>
				<Label>Enable Tab Completion</Label>
			</Flex>

			<Text className='text-sm text-slate-400'>When enabled, pressing Tab will auto-complete code suggestions.</Text>
		</Card>
	);
}
