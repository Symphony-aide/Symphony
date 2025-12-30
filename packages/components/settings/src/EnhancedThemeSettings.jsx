// EnhancedThemeSettings.jsx
import React from "react";
import { Button, Card, Flex, Box, Heading } from "ui";
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
		<Flex direction="column" gap={3}>
			{/* Compact Inheritance Info */}
			{isLocal && (
				<Card className="bg-slate-700 p-2 border-l-4 border-indigo-500">
					<Flex align="center" justify="between">
						<Box>
							<Heading level={4} className="text-xs font-medium text-indigo-300">
								{hasOverride ? "🔄 Overriding Global" : "📋 Using Global Settings"}
							</Heading>
						</Box>
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
					</Flex>
				</Card>
			)}

			{/* Settings Component */}
			<Box className={`${hasOverride ? 'border-l-4 border-emerald-500 pl-3' : ''}`}>
				<EditorThemeSettings 
					themeSettings={themeSettings} 
					setThemeSettings={setThemeSettings} 
				/>
			</Box>
		</Flex>
	);
}
