// tokenTypes.js
// Token-based highlighting logic

export function tokenizeCode(code, grammar, language) {
	if (!code || !grammar) {
		return [];
	}
	
	const lines = code.split('\n');
	const tokenizedLines = [];
	
	for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
		const line = lines[lineIndex];
		const tokens = tokenizeLine(line, grammar, lineIndex);
		tokenizedLines.push(tokens);
	}
	
	return tokenizedLines;
}

function tokenizeLine(line, grammar, lineIndex) {
	if (!line) {
		return [{
			content: '\u00A0', // Non-breaking space for empty lines
			scopes: ['source'],
			startIndex: 0,
			endIndex: 0
		}];
	}
	
	const tokens = [];
	let currentIndex = 0;
	
	// Simple regex-based tokenization using grammar patterns
	while (currentIndex < line.length) {
		let matched = false;
		
		// Try to match each pattern in the grammar
		for (const pattern of grammar.patterns || []) {
			const match = matchPattern(line, currentIndex, pattern);
			if (match) {
				// Add the matched token
				tokens.push({
					content: match.content,
					scopes: [pattern.name || 'source'],
					startIndex: match.startIndex,
					endIndex: match.endIndex
				});
				
				currentIndex = match.endIndex;
				matched = true;
				break;
			}
		}
		
		// If no pattern matched, add a single character as plain text
		if (!matched) {
			const nextChar = line[currentIndex];
			tokens.push({
				content: nextChar,
				scopes: ['source'],
				startIndex: currentIndex,
				endIndex: currentIndex + 1
			});
			currentIndex++;
		}
	}
	
	// Merge adjacent tokens with the same scope for efficiency
	return mergeAdjacentTokens(tokens);
}

function matchPattern(line, startIndex, pattern) {
	const remainingLine = line.slice(startIndex);
	
	if (pattern.match) {
		// Simple regex match
		const regex = new RegExp(pattern.match);
		const match = remainingLine.match(regex);
		if (match && match.index === 0) {
			return {
				content: match[0],
				startIndex: startIndex,
				endIndex: startIndex + match[0].length
			};
		}
	}
	
	if (pattern.begin && pattern.end) {
		// Begin/end pattern (for strings, comments, etc.)
		const beginRegex = new RegExp(pattern.begin);
		const beginMatch = remainingLine.match(beginRegex);
		
		if (beginMatch && beginMatch.index === 0) {
			const afterBegin = remainingLine.slice(beginMatch[0].length);
			const endRegex = new RegExp(pattern.end);
			const endMatch = afterBegin.match(endRegex);
			
			if (endMatch) {
				const totalLength = beginMatch[0].length + endMatch.index + endMatch[0].length;
				return {
					content: remainingLine.slice(0, totalLength),
					startIndex: startIndex,
					endIndex: startIndex + totalLength
				};
			} else {
				// End pattern not found, match to end of line
				return {
					content: remainingLine,
					startIndex: startIndex,
					endIndex: line.length
				};
			}
		}
	}
	
	return null;
}

function mergeAdjacentTokens(tokens) {
	if (tokens.length <= 1) {
		return tokens;
	}
	
	const merged = [tokens[0]];
	
	for (let i = 1; i < tokens.length; i++) {
		const current = tokens[i];
		const previous = merged[merged.length - 1];
		
		// Merge if same scope and adjacent
		if (current.scopes.length === 1 && 
			previous.scopes.length === 1 && 
			current.scopes[0] === previous.scopes[0] &&
			previous.endIndex === current.startIndex) {
			
			previous.content += current.content;
			previous.endIndex = current.endIndex;
		} else {
			merged.push(current);
		}
	}
	
	return merged;
}

// Token scope utilities
export function getTokenType(scopes) {
	if (!scopes || scopes.length === 0) {
		return 'text';
	}
	
	const scope = scopes[0];
	
	if (scope.includes('keyword')) return 'keyword';
	if (scope.includes('string')) return 'string';
	if (scope.includes('comment')) return 'comment';
	if (scope.includes('constant')) return 'constant';
	if (scope.includes('entity.name.function')) return 'function';
	if (scope.includes('entity.name.class')) return 'class';
	if (scope.includes('entity.name.tag')) return 'tag';
	if (scope.includes('variable')) return 'variable';
	if (scope.includes('storage.type')) return 'type';
	if (scope.includes('support.type')) return 'support';
	
	return 'text';
}

export function isTokenType(scopes, type) {
	return getTokenType(scopes) === type;
}
