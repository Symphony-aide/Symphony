// useTokenizer.js
import { useMemo } from "react";
import { tokenizeCode } from "../utils/tokenTypes";

export function useTokenizer(code, grammarData, language) {
	return useMemo(() => {
		if (!code) {
			return [];
		}
		
		// If no grammar is available, return simple line-based tokens
		if (!grammarData?.grammar || language === "plaintext") {
			return code.split('\n').map(line => [{
				content: line || '\u00A0',
				scopes: ['source.plaintext'],
				startIndex: 0,
				endIndex: line.length
			}]);
		}
		
		try {
			return tokenizeCode(code, grammarData.grammar, language);
		} catch (error) {
			console.warn(`Tokenization failed for language: ${language}`, error);
			// Fallback to plain text tokenization
			return code.split('\n').map(line => [{
				content: line || '\u00A0',
				scopes: ['source.plaintext'],
				startIndex: 0,
				endIndex: line.length
			}]);
		}
	}, [code, grammarData, language]);
}
