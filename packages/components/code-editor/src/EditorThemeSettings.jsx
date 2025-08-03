import React from "react";

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
			{/* اختيار الثيم */}
			<div>
				<label className='block text-sm mb-1'>Editor Theme</label>
				<select
					value={themeSettings.theme}
					onChange={handleChangeTheme}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full'
				>
					<option value='vs-dark'>Dark</option>
					<option value='light'>Light</option>
					<option value='hc-black'>High Contrast</option>
				</select>
			</div>

			{/* حجم الخط */}
			<div>
				<label className='block text-sm mb-1'>Font Size</label>
				<input
					type='number'
					min={12}
					max={24}
					value={themeSettings.fontSize}
					onChange={handleChangeFontSize}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1 w-20'
				/>
			</div>

			{/* نوع الخط */}
			<div>
				<label className='block text-sm mb-1'>Font Type</label>
				<select
					value={themeSettings.fontFamily}
					onChange={handleChangeFontFamily}
					className='bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full'
				>
					<option value='"Fira Code", monospace'>Fira Code</option>
					<option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
					<option value='"Cascadia Code", monospace'>Cascadia Code</option>
					<option value='"Source Code Pro", monospace'>Source Code Pro</option>
					<option value='"IBM Plex Mono", monospace'>IBM Plex Mono</option>
					<option value='"Ubuntu Mono", monospace'>Ubuntu Mono</option>
					<option value='"Inconsolata", monospace'>Inconsolata</option>
					<option value='"Courier New", monospace'>Courier New</option>
					<option value='monospace'>System Default</option>
				</select>
			</div>
		</div>
	);
}
