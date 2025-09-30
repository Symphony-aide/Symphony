//App.jsx
import React, { useState } from "react";
import { Button } from "ui";
import { Editor } from "@symphony/code-editor";
import { CommandProvider } from "@symphony/commands";

function App() {
	const handleLanguageDetected = (detectedLang) => {
		console.log('Language detected:', detectedLang);
	};

	return (
		<CommandProvider options={{
			maxStackSize: 1000,
			enablePersistence: true,
			processorOptions: {
				enableMerging: true,
				mergeTimeWindow: 1000
			}
		}}>
			<div className='h-screen w-screen bg-gray-900 text-white flex flex-col'>
				{/* Header */}
				<div className="bg-gray-800 p-4 border-b border-gray-700">
					<div className="flex items-center gap-4 flex-wrap">
						<h1 className="text-xl font-bold text-blue-400">Symphony IDE Demo</h1>
					</div>
				</div>

				{/* Main Content - Unified Editor */}
				<div className="flex-1 flex overflow-hidden">
					<Editor
						initialCode={`// Welcome to Symphony IDE!
// This editor now has both Edit and Preview modes integrated
// Click the ✏️ Edit / 👁️ Preview buttons in the editor toolbar to switch modes

function fibonacci(n) {
	if (n <= 1) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);

console.log("Fibonacci of 10:", fibonacci(10));
console.log("Doubled numbers:", doubled);

// Try switching to Preview mode to see the beautiful syntax highlighting!`}
						language='javascript'
						theme='vs-dark'
						onSave={code => console.log("Saved code:", code)}
						onRun={code => console.log("Run code:", code)}
						onLanguageDetected={handleLanguageDetected}
						className='flex-1 overflow-auto'
					/>
				</div>
			</div>
		</CommandProvider>
	);
}

export default App;
