// ProjectSettingsStatus.jsx
import React, { useState } from "react";
import { Button, Card, Flex, Box, Heading, Text, Code, Grid } from "ui";

export default function ProjectSettingsStatus({ 
	hasProjectSettings = false,
	projectPath = null,
	onCreateProject,
	onExportSettings,
	onImportSettings 
}) {
	const [showDetails, setShowDetails] = useState(false);

	if (!hasProjectSettings) {
		return (
			<Card className="bg-yellow-900 border border-yellow-700 p-4 mb-4">
				<Flex align="start" gap={3}>
					<Text className="text-yellow-400 text-xl">📁</Text>
					<Box className="flex-1">
						<Heading level={3} className="text-yellow-300 font-medium">No Project Settings Found</Heading>
						<Text className="text-yellow-200 text-sm mt-1">
							Create project-specific settings to override global preferences for this workspace.
						</Text>
						<Flex gap={2} className="mt-3">
							<Button
								onClick={onCreateProject}
								className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 text-sm"
							>
								Create Project Settings
							</Button>
							<Button
								onClick={() => setShowDetails(!showDetails)}
								variant="secondary"
								className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 text-sm"
							>
								Learn More
							</Button>
						</Flex>
						
						{showDetails && (
							<Box className="mt-3 p-3 bg-yellow-800 rounded text-sm text-yellow-100">
								<Text className="font-medium mb-2">Project settings allow you to:</Text>
								<Flex direction="column" gap={1} className="text-xs">
									<Text>• Override global theme and editor preferences</Text>
									<Text>• Set project-specific formatting rules</Text>
									<Text>• Configure development tools per project</Text>
									<Text>• Share settings with your team via version control</Text>
								</Flex>
								<Text className="mt-2 text-xs opacity-75">
									Settings will be saved to <Code className="bg-yellow-700 px-1 rounded">.symphony/settings.json</Code> in your project root.
								</Text>
							</Box>
						)}
					</Box>
				</Flex>
			</Card>
		);
	}

	return (
		<Card className="bg-green-900 border border-green-700 p-4 mb-4">
			<Flex align="start" gap={3}>
				<Text className="text-green-400 text-xl">✅</Text>
				<Box className="flex-1">
					<Heading level={3} className="text-green-300 font-medium">Project Settings Active</Heading>
					<Text className="text-green-200 text-sm mt-1">
						Using project-specific settings from: <Code className="bg-green-800 px-1 rounded">{projectPath}</Code>
					</Text>
					<Flex gap={2} className="mt-3">
						<Button
							onClick={onExportSettings}
							className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 text-sm"
						>
							Export Settings
						</Button>
						<Button
							onClick={onImportSettings}
							variant="secondary"
							className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 text-sm"
						>
							Import Settings
						</Button>
						<Button
							onClick={() => setShowDetails(!showDetails)}
							variant="secondary"
							className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 text-sm"
						>
							Details
						</Button>
					</Flex>
					
					{showDetails && (
						<Box className="mt-3 p-3 bg-green-800 rounded text-sm text-green-100">
							<Grid columns={2} gap={4}>
								<Box>
									<Text className="font-medium mb-1">Project Info:</Text>
									<Flex direction="column" gap={1} className="text-xs">
										<Text>Path: {projectPath}</Text>
										<Text>Settings: .symphony/settings.json</Text>
										<Text>Status: Active</Text>
									</Flex>
								</Box>
								<Box>
									<Text className="font-medium mb-1">Actions:</Text>
									<Flex direction="column" gap={1} className="text-xs">
										<Text>• Export for team sharing</Text>
										<Text>• Import from another project</Text>
										<Text>• Reset to global defaults</Text>
									</Flex>
								</Box>
							</Grid>
						</Box>
					)}
				</Box>
			</Flex>
		</Card>
	);
}
