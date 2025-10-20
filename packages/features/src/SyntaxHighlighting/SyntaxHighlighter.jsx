// SyntaxHighlighter.jsx
import React, { useMemo } from "react";
import { useLanguageDetection } from "./hooks/useLanguageDetection";
import { useTextMateGrammar } from "./hooks/useTextMateGrammar";
import { useTokenizer } from "./hooks/useTokenizer";
import { useThemeManager } from "./hooks/useThemeManager";

export default function SyntaxHighlighter({
	code = "",
	language = null,
	theme = "dark",
	fileName = "",
	onLanguageDetected = () => {},
	className = "",
	showLineNumbers = false,
	lineNumberStart = 1,
}) {
	// Detect language from filename or provided language
	const detectedLanguage = useLanguageDetection(fileName, language, code);
	
	// Load TextMate grammar for the detected language
	const { grammar } = useTextMateGrammar(detectedLanguage);
	
	// Get theme colors and styles
	const themeData = useThemeManager(theme);
	
	// Tokenize the code using the grammar
	const tokens = useTokenizer(code, { grammar }, detectedLanguage);
	
	// Notify parent component when language is detected
	React.useEffect(() => {
		if (detectedLanguage && detectedLanguage !== language) {
			onLanguageDetected(detectedLanguage);
		}
	}, [detectedLanguage, language, onLanguageDetected]);
	
	// Helper function to get Tailwind classes for token types
	const getTokenClasses = (scopes) => {
		if (!scopes || scopes.length === 0) return '';
		
		const scope = scopes[0];
		let classes = '';
		
		if (scope.includes('keyword')) classes += 'font-bold ';
		if (scope.includes('comment')) classes += 'italic opacity-80 ';
		if (scope.includes('constant')) classes += 'font-medium ';
		if (scope.includes('entity.name.function')) classes += 'font-semibold ';
		if (scope.includes('entity.name.class')) classes += 'font-semibold underline decoration-dotted ';
		
		return classes.trim();
	};
	
	// Memoize the rendered lines for performance
	const renderedLines = useMemo(() => {
		if (!tokens || tokens.length === 0) {
			return code.split('\n').map((line, index) => (
				<div key={index} className="flex items-start min-h-[1.4em] relative hover:bg-white/5">
					{showLineNumbers && (
						<span 
							className="inline-block min-w-[2.5rem] pr-4 text-right select-none opacity-70 flex-shrink-0 tabular-nums"
							style={{ color: themeData.lineNumber }}
						>
							{lineNumberStart + index}
						</span>
					)}
					<span className="flex-1 whitespace-pre break-words">{line || '\u00A0'}</span>
				</div>
			));
		}
		
		return tokens.map((line, lineIndex) => (
			<div key={lineIndex} className="flex items-start min-h-[1.4em] relative hover:bg-white/5">
				{showLineNumbers && (
					<span 
						className="inline-block min-w-[2.5rem] pr-4 text-right select-none opacity-70 flex-shrink-0 tabular-nums"
						style={{ color: themeData.lineNumber }}
					>
						{lineNumberStart + lineIndex}
					</span>
				)}
				<span className="flex-1 whitespace-pre break-words">
					{line.map((token, tokenIndex) => {
						const tokenClasses = getTokenClasses(token.scopes);
						return (
							<span
								key={tokenIndex}
								className={`relative ${tokenClasses}`}
								style={{ color: themeData.getTokenColor(token.scopes) }}
							>
								{token.content}
							</span>
						);
					})}
				</span>
			</div>
		));
	}, [tokens, code, showLineNumbers, lineNumberStart, themeData, getTokenClasses]);

	return (
		<div 
			className={`font-mono text-sm leading-relaxed whitespace-pre overflow-auto rounded border-0 relative p-2 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${className}`}
			data-language={detectedLanguage}
			data-theme={themeData.type}
			style={{
				backgroundColor: themeData.background,
				color: themeData.foreground,
				colorScheme: themeData.type,
			}}
			tabIndex={0}
			role="textbox"
			aria-label={`Code editor for ${detectedLanguage}`}
			aria-readonly="true"
		>
			<div className="min-h-full">
				{renderedLines}
			</div>
		</div>
	);
}
