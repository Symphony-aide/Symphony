// useLanguageDetection.js
import { useMemo } from "react";
import { getLanguageFromExtension, detectLanguageFromContent } from "../utils/languageMap";

export function useLanguageDetection(fileName = "", explicitLanguage = null, code = "") {
	return useMemo(() => {
		// If language is explicitly provided, use it
		if (explicitLanguage) {
			return explicitLanguage;
		}
		
		// Try to detect from file extension
		if (fileName) {
			const extensionLanguage = getLanguageFromExtension(fileName);
			if (extensionLanguage) {
				return extensionLanguage;
			}
		}
		
		// Try to detect from content
		if (code) {
			const contentLanguage = detectLanguageFromContent(code);
			if (contentLanguage) {
				return contentLanguage;
			}
		}
		
		// Default to plain text
		return "plaintext";
	}, [fileName, explicitLanguage, code]);
}
