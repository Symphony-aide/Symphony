// SettingsValidationFeature.jsx
import React from "react";
import { useSettingsValidation } from "./hooks/useSettingsValidation";

/**
 * SettingsValidation Feature Component
 * Manages settings validation with schema support
 * 
 * @param {Object} props
 * @param {Function} props.children - Render prop function receiving validation API
 * @param {Object} props.schema - Validation schema
 * @returns {React.Element}
 */
export function SettingsValidationFeature({ children, schema = {} }) {
	const validation = useSettingsValidation(schema);

	// Expose clean API to consumers
	const api = {
		// State
		errors: validation.errors,
		touched: validation.touched,
		isValid: validation.isValid,

		// Operations
		validate: validation.validate,
		validateAll: validation.validateAll,
		touch: validation.touch,
		clearErrors: validation.clearErrors,
		clearError: validation.clearError,
		getError: validation.getError,
		hasError: validation.hasError,
	};

	return children(api);
}

/**
 * Hook version of SettingsValidation feature
 * Use this when you don't need the render prop pattern
 */
export { useSettingsValidation } from "./hooks/useSettingsValidation";
