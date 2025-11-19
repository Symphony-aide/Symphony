// useSettingsValidation.js
import { useState, useCallback } from "react";
import { validateValue } from "../services/ValidationService";

/**
 * Hook for settings validation
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation state and operations
 */
export function useSettingsValidation(schema = {}) {
	const [errors, setErrors] = useState({});
	const [touched, setTouched] = useState({});

	// Validate a single setting
	const validate = useCallback((key, value) => {
		const fieldSchema = schema[key];
		if (!fieldSchema) return { isValid: true, error: null };

		const result = validateValue(value, fieldSchema);
		
		if (!result.isValid) {
			setErrors(prev => ({ ...prev, [key]: result.error }));
		} else {
			setErrors(prev => {
				const next = { ...prev };
				delete next[key];
				return next;
			});
		}

		return result;
	}, [schema]);

	// Validate all settings
	const validateAll = useCallback((settings) => {
		const newErrors = {};
		let isValid = true;

		Object.keys(schema).forEach(key => {
			const value = settings[key];
			const result = validateValue(value, schema[key]);
			
			if (!result.isValid) {
				newErrors[key] = result.error;
				isValid = false;
			}
		});

		setErrors(newErrors);
		return { isValid, errors: newErrors };
	}, [schema]);

	// Mark field as touched
	const touch = useCallback((key) => {
		setTouched(prev => ({ ...prev, [key]: true }));
	}, []);

	// Clear errors
	const clearErrors = useCallback(() => {
		setErrors({});
	}, []);

	// Clear specific error
	const clearError = useCallback((key) => {
		setErrors(prev => {
			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	// Get error for field
	const getError = useCallback((key) => {
		return touched[key] ? errors[key] : null;
	}, [errors, touched]);

	// Check if field has error
	const hasError = useCallback((key) => {
		return touched[key] && !!errors[key];
	}, [errors, touched]);

	// Check if all valid
	const isValid = Object.keys(errors).length === 0;

	return {
		// State
		errors,
		touched,
		isValid,

		// Operations
		validate,
		validateAll,
		touch,
		clearErrors,
		clearError,
		getError,
		hasError,
	};
}
