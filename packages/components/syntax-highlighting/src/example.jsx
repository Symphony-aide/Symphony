// example.jsx - Usage example for SyntaxHighlighter component
import React, { useState } from "react";
import SyntaxHighlighter from "./SyntaxHighlighter.jsx";

const SAMPLE_CODE = {
	javascript: `// JavaScript Example
function fibonacci(n) {
	if (n <= 1) return n;
	return fibonacci(n - 1) + fibonacci(n - 2);
}

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);

console.log("Fibonacci of 10:", fibonacci(10));
console.log("Doubled numbers:", doubled);`,

	python: `# Python Example
def fibonacci(n):
	"""Calculate fibonacci number recursively"""
	if n <= 1:
		return n
	return fibonacci(n - 1) + fibonacci(n - 2)

numbers = [1, 2, 3, 4, 5]
doubled = [x * 2 for x in numbers]

print(f"Fibonacci of 10: {fibonacci(10)}")
print(f"Doubled numbers: {doubled}")`,

	html: `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sample Page</title>
	<style>
		body { font-family: Arial, sans-serif; }
		.container { max-width: 800px; margin: 0 auto; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Welcome to My Site</h1>
		<p>This is a sample HTML page.</p>
	</div>
</body>
</html>`,

	css: `/* CSS Example */
.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 20px;
	background-color: #f5f5f5;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.button {
	display: inline-block;
	padding: 12px 24px;
	background: linear-gradient(45deg, #007acc, #0099ff);
	color: white;
	text-decoration: none;
	border-radius: 6px;
	transition: transform 0.2s ease;
}

.button:hover {
	transform: translateY(-2px);
}`
};

export default function SyntaxHighlighterExample() {
	const [selectedLanguage, setSelectedLanguage] = useState('javascript');
	const [theme, setTheme] = useState('dark');
	const [showLineNumbers, setShowLineNumbers] = useState(true);

	const handleLanguageDetected = (detectedLang) => {
		console.log('Language detected:', detectedLang);
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>SyntaxHighlighter Component Demo</h1>
			
			{/* Controls */}
			<div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
				<div>
					<label htmlFor="language-select">Language: </label>
					<select 
						id="language-select"
						value={selectedLanguage} 
						onChange={(e) => setSelectedLanguage(e.target.value)}
						style={{ padding: '5px' }}
					>
						{Object.keys(SAMPLE_CODE).map(lang => (
							<option key={lang} value={lang}>{lang}</option>
						))}
					</select>
				</div>
				
				<div>
					<label htmlFor="theme-select">Theme: </label>
					<select 
						id="theme-select"
						value={theme} 
						onChange={(e) => setTheme(e.target.value)}
						style={{ padding: '5px' }}
					>
						<option value="dark">Dark</option>
						<option value="light">Light</option>
					</select>
				</div>
				
				<div>
					<label>
						<input 
							type="checkbox" 
							checked={showLineNumbers}
							onChange={(e) => setShowLineNumbers(e.target.checked)}
						/>
						Show Line Numbers
					</label>
				</div>
			</div>

			{/* Syntax Highlighter */}
			<div className="border border-gray-300 rounded-lg overflow-hidden max-h-[500px]">
				<SyntaxHighlighter
					code={SAMPLE_CODE[selectedLanguage]}
					language={selectedLanguage}
					theme={theme}
					fileName={`example.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`}
					showLineNumbers={showLineNumbers}
					onLanguageDetected={handleLanguageDetected}
					className="w-full h-full"
				/>
			</div>

			{/* Usage Example */}
			<div style={{ marginTop: '40px' }}>
				<h2>Usage</h2>
				<pre style={{ 
					backgroundColor: '#f5f5f5', 
					padding: '15px', 
					borderRadius: '5px',
					overflow: 'auto'
				}}>
{`import SyntaxHighlighter from '@symphony/syntax-highlighting';

<SyntaxHighlighter
  code={yourCode}
  language="javascript"  // optional, will auto-detect
  theme="dark"          // 'dark' or 'light'
  fileName="example.js" // for language detection
  showLineNumbers={true}
  onLanguageDetected={(lang) => console.log(lang)}
  className="custom-class"
/>`}
				</pre>
			</div>
		</div>
	);
}
