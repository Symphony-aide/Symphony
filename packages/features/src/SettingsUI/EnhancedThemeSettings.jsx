// EnhancedThemeSettings.jsx
import React from "react";
import { Button, Card } from "ui";
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
				<Card className="bg-slate-700 p-2 border-l-4 border-indigo-500">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="text-xs font-medium text-indigo-300">
								{hasOverride ? "🔄 Overriding Global" : "📋 Using Global Settings"}
							</h4>
						</div>
						{hasOverride && (
							<Button
								onClick={handleReset}
								size="sm"
								variant="secondary"
								className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1"
							>
								Reset
							</Button>
						)}
					</div>
				</Card>
			)}

			{/* Settings Component */}
			<div className={`${hasOverride ? 'border-l-4 border-emerald-500 pl-3' : ''}`}>
				<EditorThemeSettings 
					themeSettings={themeSettings} 
					setThemeSettings={setThemeSettings} 
				/>
			</div>
		</div>
	);
}
