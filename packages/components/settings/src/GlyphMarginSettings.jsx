// GlyphMarginSettings.jsx
import React, { useState, useEffect } from "react";

export default function GlyphMarginSettings({ enabled, onChange }) {
	const [isEnabled, setIsEnabled] = useState(enabled);

	useEffect(() => {
		onChange({ enabled: isEnabled });
	}, [isEnabled]);

	return (
		<div className='p-4 bg-gray-800 text-white rounded shadow space-y-3'>
			<h2 className='text-lg font-bold'>Glyph Margin Settings</h2>

			<div className='flex items-center space-x-2'>
				<input type='checkbox' checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} />
				<span>Enable Glyph Margin</span>
			</div>
		</div>
	);
}
