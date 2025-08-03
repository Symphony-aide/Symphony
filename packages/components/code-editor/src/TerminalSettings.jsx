import React from "react";

export default function TerminalSettings({ terminalSettings, setTerminalSettings }) {
	const handleChange = (key, value) => {
		setTerminalSettings(prev => ({
			...prev,
			[key]: value,
		}));
	};

	return (
		<div className='space-y-4'>
			{/* Font Family */}
			<div>
				<label className='block text-sm mb-1'>Font Family</label>
				<select
					value={terminalSettings.fontFamily}
					onChange={e => handleChange("fontFamily", e.target.value)}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1'
				>
					<option value='monospace'>Monospace (Default)</option>
					<option value='Fira Code'>Fira Code</option>
					<option value='JetBrains Mono'>JetBrains Mono</option>
					<option value='Consolas'>Consolas</option>
					<option value='Courier New'>Courier New</option>
				</select>
			</div>

			{/* Font Size */}
			<div>
				<label className='block text-sm mb-1'>Font Size (px)</label>
				<input
					type='number'
					min={10}
					max={32}
					value={terminalSettings.fontSize}
					onChange={e => handleChange("fontSize", Number(e.target.value))}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1 w-20'
				/>
			</div>

			{/* Font Weight */}
			<div>
				<label className='block text-sm mb-1'>Font Weight</label>
				<select
					value={terminalSettings.fontWeight}
					onChange={e => handleChange("fontWeight", e.target.value)}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1'
				>
					<option value='normal'>Normal</option>
					<option value='bold'>Bold</option>
					<option value='lighter'>Lighter</option>
				</select>
			</div>

			{/* Line Height */}
			<div>
				<label className='block text-sm mb-1'>Line Height</label>
				<input
					type='number'
					step={0.1}
					min={1}
					max={2}
					value={terminalSettings.lineHeight}
					onChange={e => handleChange("lineHeight", Number(e.target.value))}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1 w-20'
				/>
			</div>

			{/* Cursor Style */}
			<div>
				<label className='block text-sm mb-1'>Cursor Style</label>
				<select
					value={terminalSettings.cursorStyle}
					onChange={e => handleChange("cursorStyle", e.target.value)}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1'
				>
					<option value='block'>Block</option>
					<option value='underline'>Underline</option>
					<option value='bar'>Bar</option>
				</select>
			</div>
		</div>
	);
}
