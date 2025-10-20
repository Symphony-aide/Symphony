//TerminalSettings.jsx
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Label } from "ui";

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
				<Label className='block text-sm mb-1'>Font Family</Label>
				<Select value={terminalSettings.fontFamily} onValueChange={(value) => handleChange("fontFamily", value)}>
					<SelectTrigger className='bg-slate-800 border-slate-600'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='monospace'>Monospace (Default)</SelectItem>
						<SelectItem value='Fira Code'>Fira Code</SelectItem>
						<SelectItem value='JetBrains Mono'>JetBrains Mono</SelectItem>
						<SelectItem value='Consolas'>Consolas</SelectItem>
						<SelectItem value='Courier New'>Courier New</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Font Size */}
			<div>
				<Label className='block text-sm mb-1'>Font Size (px)</Label>
				<Input
					type='number'
					min={10}
					max={32}
					value={terminalSettings.fontSize}
					onChange={e => handleChange("fontSize", Number(e.target.value))}
					className='bg-slate-800 border-slate-600 text-black w-20'
				/>
			</div>

			{/* Font Weight */}
			<div>
				<Label className='block text-sm mb-1'>Font Weight</Label>
				<Select value={terminalSettings.fontWeight} onValueChange={(value) => handleChange("fontWeight", value)}>
					<SelectTrigger className='bg-slate-800 border-slate-600'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='normal'>Normal</SelectItem>
						<SelectItem value='bold'>Bold</SelectItem>
						<SelectItem value='lighter'>Lighter</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Line Height */}
			<div>
				<Label className='block text-sm mb-1'>Line Height</Label>
				<Input
					type='number'
					step={0.1}
					min={1}
					max={2}
					value={terminalSettings.lineHeight}
					onChange={e => handleChange("lineHeight", Number(e.target.value))}
					className='bg-slate-800 border-slate-600 text-black w-20'
				/>
			</div>

			{/* Cursor Style */}
			<div>
				<Label className='block text-sm mb-1'>Cursor Style</Label>
				<Select value={terminalSettings.cursorStyle} onValueChange={(value) => handleChange("cursorStyle", value)}>
					<SelectTrigger className='bg-slate-800 border-slate-600'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='block'>Block</SelectItem>
						<SelectItem value='underline'>Underline</SelectItem>
						<SelectItem value='bar'>Bar</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
