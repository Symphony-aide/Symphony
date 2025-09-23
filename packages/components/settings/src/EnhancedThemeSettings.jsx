// EnhancedThemeSettings.jsx
import React from "react";
import EditorThemeSettings from "./EditorThemeSettings";

export default function EnhancedThemeSettings({ 
	themeSettings, 
	setThemeSettings, 
	scope = 'global',
	globalThemeSettings = null 
}) {
	const isLocal = scope === 'local';
	const hasOverride = isLocal && globalThemeSettings && (
		themeSettings.theme !== globalThemeSettings.theme ||
		themeSettings.fontSize !== globalThemeSettings.fontSize ||
		themeSettings.fontFamily !== globalThemeSettings.fontFamily
	);

	const handleReset = () => {
		if (isLocal && globalThemeSettings) {
			setThemeSettings(globalThemeSettings);
		}
	};

	return (
		<div className="space-y-3">
			{/* Compact Inheritance Info */}
			{isLocal && (
				<div className="bg-gray-700 p-2 rounded border-l-4 border-blue-500">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="text-xs font-medium text-blue-300">
								{hasOverride ? "🔄 Overriding Global" : "📋 Using Global Settings"}
							</h4>
						</div>
						{hasOverride && (
							<button
								onClick={handleReset}
								className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition-colors"
							>
								Reset
							</button>
						)}
					</div>
				</div>
			)}

			{/* Settings Component */}
			<div className={`${hasOverride ? 'border-l-4 border-green-500 pl-3' : ''}`}>
				<EditorThemeSettings 
					themeSettings={themeSettings} 
					setThemeSettings={setThemeSettings} 
				/>
			</div>
		</div>
	);
}
