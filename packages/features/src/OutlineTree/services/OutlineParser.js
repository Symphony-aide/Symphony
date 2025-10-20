// OutlineParser.js
import * as acorn from "acorn";
import * as walk from "acorn-walk";

/**
 * Parse JavaScript/TypeScript code to extract outline
 * @param {string} code - Code to parse
 * @param {string} language - Programming language
 * @returns {Array} Outline items
 */
export function parseCode(code, language = 'javascript') {
	if (!code || !code.trim()) {
		return [];
	}

	switch (language) {
		case 'javascript':
		case 'jsx':
		case 'typescript':
		case 'tsx':
			return parseJavaScript(code);
		case 'python':
			return parsePython(code);
		default:
			return parseGeneric(code);
	}
}

/**
 * Parse JavaScript/TypeScript code
 */
function parseJavaScript(code) {
	const outline = [];

	try {
		const ast = acorn.parse(code, {
			ecmaVersion: 'latest',
			sourceType: 'module',
			locations: true,
		});

		walk.simple(ast, {
			FunctionDeclaration(node) {
				outline.push({
					type: 'function',
					name: node.id?.name || 'anonymous',
					line: node.loc.start.line,
					kind: 'declaration',
				});
			},
			VariableDeclaration(node) {
				node.declarations.forEach(decl => {
					if (decl.id?.name) {
						outline.push({
							type: 'variable',
							name: decl.id.name,
							line: decl.loc.start.line,
							kind: node.kind, // const, let, var
						});
					}
				});
			},
			ClassDeclaration(node) {
				outline.push({
					type: 'class',
					name: node.id?.name || 'anonymous',
					line: node.loc.start.line,
					kind: 'declaration',
				});
			},
			MethodDefinition(node) {
				outline.push({
					type: 'method',
					name: node.key?.name || 'anonymous',
					line: node.loc.start.line,
					kind: node.kind, // constructor, method, get, set
				});
			},
		});
	} catch (error) {
		console.error('Failed to parse JavaScript:', error);
	}

	return outline.sort((a, b) => a.line - b.line);
}

/**
 * Parse Python code (simplified)
 */
function parsePython(code) {
	const outline = [];
	const lines = code.split('\n');

	lines.forEach((line, index) => {
		const trimmed = line.trim();

		// Function definitions
		if (trimmed.startsWith('def ')) {
			const match = trimmed.match(/def\s+(\w+)/);
			if (match) {
				outline.push({
					type: 'function',
					name: match[1],
					line: index + 1,
					kind: 'definition',
				});
			}
		}

		// Class definitions
		if (trimmed.startsWith('class ')) {
			const match = trimmed.match(/class\s+(\w+)/);
			if (match) {
				outline.push({
					type: 'class',
					name: match[1],
					line: index + 1,
					kind: 'definition',
				});
			}
		}
	});

	return outline;
}

/**
 * Generic parser for other languages (regex-based)
 */
function parseGeneric(code) {
	const outline = [];
	const lines = code.split('\n');

	lines.forEach((line, index) => {
		const trimmed = line.trim();

		// Function patterns
		const funcPatterns = [
			/function\s+(\w+)/,
			/const\s+(\w+)\s*=\s*\(/,
			/let\s+(\w+)\s*=\s*\(/,
			/var\s+(\w+)\s*=\s*\(/,
			/(\w+)\s*:\s*function/,
		];

		for (const pattern of funcPatterns) {
			const match = trimmed.match(pattern);
			if (match) {
				outline.push({
					type: 'function',
					name: match[1],
					line: index + 1,
					kind: 'unknown',
				});
				break;
			}
		}

		// Class patterns
		const classPattern = /class\s+(\w+)/;
		const classMatch = trimmed.match(classPattern);
		if (classMatch) {
			outline.push({
				type: 'class',
				name: classMatch[1],
				line: index + 1,
				kind: 'unknown',
			});
		}
	});

	return outline;
}
