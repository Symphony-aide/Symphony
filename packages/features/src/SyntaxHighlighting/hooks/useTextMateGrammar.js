// useTextMateGrammar.js
import { useState, useEffect } from "react";
import { loadGrammar, getGrammarRegistry } from "../utils/grammarRegistry";

export function useTextMateGrammar(language) {
	const [grammar, setGrammar] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	
	useEffect(() => {
		if (!language || language === "plaintext") {
			setGrammar(null);
			setLoading(false);
			setError(null);
			return;
		}
		
		const loadLanguageGrammar = async () => {
			setLoading(true);
			setError(null);
			
			try {
				// Check if grammar is already cached
				const registry = getGrammarRegistry();
				let loadedGrammar = registry.getGrammar(language);
				
				if (!loadedGrammar) {
					// Load grammar from file
					loadedGrammar = await loadGrammar(language);
				}
				
				setGrammar(loadedGrammar);
			} catch (err) {
				console.warn(`Failed to load grammar for language: ${language}`, err);
				setError(err);
				setGrammar(null);
			} finally {
				setLoading(false);
			}
		};
		
		loadLanguageGrammar();
	}, [language]);
	
	return { grammar, loading, error };
}
