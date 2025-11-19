// ValidationService.js
/**
 * Validation service for settings values
 */

/**
 * Validate a value against a schema
 * @param {*} value - Value to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export function validateValue(value, schema) {
	if (!schema) {
		return { isValid: true, error: null };
	}

	// Required validation
	if (schema.required && (value === null || value === undefined || value === '')) {
		return { isValid: false, error: 'This field is required' };
	}

	// Type validation
	if (schema.type && value !== null && value !== undefined) {
		const actualType = typeof value;
		if (actualType !== schema.type) {
			return { isValid: false, error: `Expected ${schema.type}, got ${actualType}` };
		}
	}

	// Number validations
	if (typeof value === 'number') {
		if (schema.min !== undefined && value < schema.min) {
			return { isValid: false, error: `Value must be at least ${schema.min}` };
		}
		if (schema.max !== undefined && value > schema.max) {
			return { isValid: false, error: `Value must be at most ${schema.max}` };
		}
	}

	// String validations
	if (typeof value === 'string') {
		if (schema.minLength !== undefined && value.length < schema.minLength) {
			return { isValid: false, error: `Must be at least ${schema.minLength} characters` };
		}
		if (schema.maxLength !== undefined && value.length > schema.maxLength) {
			return { isValid: false, error: `Must be at most ${schema.maxLength} characters` };
		}
		if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
			return { isValid: false, error: schema.patternMessage || 'Invalid format' };
		}
	}

	// Enum validation
	if (schema.enum && !schema.enum.includes(value)) {
		return { isValid: false, error: `Must be one of: ${schema.enum.join(', ')}` };
	}

	// Custom validator
	if (schema.validator && typeof schema.validator === 'function') {
		const result = schema.validator(value);
		if (result !== true) {
			return { isValid: false, error: result || 'Validation failed' };
		}
	}

	return { isValid: true, error: null };
}

/**
 * Create a validation schema
 * @param {Object} fields - Field definitions
 * @returns {Object} Validation schema
 */
export function createSchema(fields) {
	return fields;
}

/**
 * Common validators
 */
export const validators = {
	// Email validator
	email: (value) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value) || 'Invalid email address';
	},

	// URL validator
	url: (value) => {
		try {
			new URL(value);
			return true;
		} catch {
			return 'Invalid URL';
		}
	},

	// Positive number
	positiveNumber: (value) => {
		return value > 0 || 'Must be a positive number';
	},

	// Integer
	integer: (value) => {
		return Number.isInteger(value) || 'Must be an integer';
	},

	// Keyboard shortcut
	shortcut: (value) => {
		const shortcutRegex = /^(ctrl|alt|shift|meta)(\+(ctrl|alt|shift|meta))*\+[a-z0-9`]$/i;
		return shortcutRegex.test(value) || 'Invalid keyboard shortcut format';
	},
};

/**
 * Common schemas
 */
export const commonSchemas = {
	autoSave: {
		enabled: {
			type: 'boolean',
			required: true,
		},
		interval: {
			type: 'number',
			required: true,
			min: 1,
			max: 60,
			validator: validators.positiveNumber,
		},
	},
	theme: {
		theme: {
			type: 'string',
			required: true,
			enum: ['vs-dark', 'vs-light', 'high-contrast'],
		},
		fontSize: {
			type: 'number',
			required: true,
			min: 8,
			max: 32,
		},
		fontFamily: {
			type: 'string',
			required: true,
			minLength: 1,
		},
	},
	terminal: {
		fontFamily: {
			type: 'string',
			required: true,
		},
		fontSize: {
			type: 'number',
			required: true,
			min: 8,
			max: 32,
		},
		cursorStyle: {
			type: 'string',
			enum: ['block', 'underline', 'bar'],
		},
	},
};
