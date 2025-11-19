//EditorThemeSettings.jsx
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input, Label } from "ui";

export default function EditorThemeSettings({ themeSettings, setThemeSettings }) {
	const handleChangeTheme = e => {
		setThemeSettings(prev => ({ ...prev, theme: e.target.value }));
	};

	const handleChangeFontSize = e => {
		setThemeSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }));
	};

	const handleChangeFontFamily = e => {
		setThemeSettings(prev => ({ ...prev, fontFamily: e.target.value }));
	};

	return (
		<div className='space-y-3'>
			{/* Editor Theme */}
			<div>
				<Label className='block text-sm mb-1'>Editor Theme</Label>
				<Select value={themeSettings.theme} onValueChange={(value) => setThemeSettings(prev => ({ ...prev, theme: value }))}>
					<SelectTrigger className='bg-slate-800 border-slate-600'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='vs-dark'>Dark</SelectItem>
						<SelectItem value='light'>Light</SelectItem>
						<SelectItem value='hc-black'>High Contrast</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Font Size */}
			<div>
				<Label className='block text-sm mb-1'>Font Size</Label>
				<Input
					type='number'
					min={12}
					max={24}
					value={themeSettings.fontSize}
					onChange={handleChangeFontSize}
					className='bg-slate-800 border-slate-600 text-black w-20'
				/>
			</div>

			{/* Font Type */}
			<div>
				<Label className='block text-sm mb-1'>Font Type</Label>
				<Select value={themeSettings.fontFamily} onValueChange={(value) => setThemeSettings(prev => ({ ...prev, fontFamily: value }))}>
					<SelectTrigger className='bg-slate-800 border-slate-600'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='"Fira Code", monospace'>Fira Code</SelectItem>
						<SelectItem value='"JetBrains Mono", monospace'>JetBrains Mono</SelectItem>
						<SelectItem value='"Cascadia Code", monospace'>Cascadia Code</SelectItem>
						<SelectItem value='"Source Code Pro", monospace'>Source Code Pro</SelectItem>
						<SelectItem value='"IBM Plex Mono", monospace'>IBM Plex Mono</SelectItem>
						<SelectItem value='"Ubuntu Mono", monospace'>Ubuntu Mono</SelectItem>
						<SelectItem value='"Inconsolata", monospace'>Inconsolata</SelectItem>
						<SelectItem value='"Courier New", monospace'>Courier New</SelectItem>
						<SelectItem value='monospace'>System Default</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
