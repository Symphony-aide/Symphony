// GlyphMarginSettings.jsx
import React, { useState, useEffect } from "react";
import { Checkbox, Label, Card, Flex, Heading } from "ui";

export default function GlyphMarginSettings({ enabled, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);

	useEffect(() => {
		onChange({ enabled: isEnabled });
	}, [isEnabled]);

	return (
		<Card className='p-4 bg-slate-800 text-white space-y-3'>
			<Heading level={2} className='text-lg font-bold'>Glyph Margin Settings</Heading>

			<Flex align="center" gap={2}>
				<Checkbox 
					checked={isEnabled} 
					onCheckedChange={setIsEnabled}
					className='border-slate-600'
				/>
				<Label>Enable Glyph Margin</Label>
			</Flex>
		</Card>
	);
}
