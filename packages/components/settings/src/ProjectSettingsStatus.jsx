// ProjectSettingsStatus.jsx
import React, { useState } from "react";

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
			<div className="bg-yellow-900 border border-yellow-700 p-4 rounded-lg mb-4">
				<div className="flex items-start space-x-3">
					<div className="text-yellow-400 text-xl">📁</div>
					<div className="flex-1">
						<h3 className="text-yellow-300 font-medium">No Project Settings Found</h3>
						<p className="text-yellow-200 text-sm mt-1">
							Create project-specific settings to override global preferences for this workspace.
						</p>
						<div className="mt-3 flex space-x-2">
							<button
								onClick={onCreateProject}
								className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm transition-colors"
							>
								Create Project Settings
							</button>
							<button
								onClick={() => setShowDetails(!showDetails)}
								className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
							>
								Learn More
							</button>
						</div>
						
						{showDetails && (
							<div className="mt-3 p-3 bg-yellow-800 rounded text-sm text-yellow-100">
								<p className="font-medium mb-2">Project settings allow you to:</p>
								<ul className="list-disc list-inside space-y-1 text-xs">
									<li>Override global theme and editor preferences</li>
									<li>Set project-specific formatting rules</li>
									<li>Configure development tools per project</li>
									<li>Share settings with your team via version control</li>
								</ul>
								<p className="mt-2 text-xs opacity-75">
									Settings will be saved to <code>.symphony/settings.json</code> in your project root.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-green-900 border border-green-700 p-4 rounded-lg mb-4">
			<div className="flex items-start space-x-3">
				<div className="text-green-400 text-xl">✅</div>
				<div className="flex-1">
					<h3 className="text-green-300 font-medium">Project Settings Active</h3>
					<p className="text-green-200 text-sm mt-1">
						Using project-specific settings from: <code className="bg-green-800 px-1 rounded">{projectPath}</code>
					</p>
					<div className="mt-3 flex space-x-2">
						<button
							onClick={onExportSettings}
							className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition-colors"
						>
							Export Settings
						</button>
						<button
							onClick={onImportSettings}
							className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
						>
							Import Settings
						</button>
						<button
							onClick={() => setShowDetails(!showDetails)}
							className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
						>
							Details
						</button>
					</div>
					
					{showDetails && (
						<div className="mt-3 p-3 bg-green-800 rounded text-sm text-green-100">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="font-medium mb-1">Project Info:</p>
									<ul className="text-xs space-y-1">
										<li>Path: {projectPath}</li>
										<li>Settings: .symphony/settings.json</li>
										<li>Status: Active</li>
									</ul>
								</div>
								<div>
									<p className="font-medium mb-1">Actions:</p>
									<ul className="text-xs space-y-1">
										<li>• Export for team sharing</li>
										<li>• Import from another project</li>
										<li>• Reset to global defaults</li>
									</ul>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
