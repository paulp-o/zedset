import { describe, it, expect } from 'vitest';
import {
	validateSettings,
	extractWidgetHints,
	getFieldWidgetHints,
	validateField,
	isValidSchema
} from './validator.js';
import type { JsonSchema } from '$lib/types';

describe('validateSettings', () => {
	it('should validate against a simple schema', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				theme: { type: 'string', enum: ['light', 'dark'] },
				fontSize: { type: 'number', minimum: 8, maximum: 72 }
			},
			required: ['theme']
		};

		const validData = { theme: 'dark', fontSize: 14 };
		const result = validateSettings(validData, schema);

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should return errors for invalid data', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				theme: { type: 'string', enum: ['light', 'dark'] },
				fontSize: { type: 'number', minimum: 8, maximum: 72 }
			},
			required: ['theme']
		};

		const invalidData = { theme: 'invalid', fontSize: 999 };
		const result = validateSettings(invalidData, schema);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);

		// Check that we have theme enum error
		const themeError = result.errors.find((e) => e.path === '/theme');
		expect(themeError).toBeDefined();
		expect(themeError?.message).toContain('one of');

		// Check that we have fontSize range error
		const fontSizeError = result.errors.find((e) => e.path === '/fontSize');
		expect(fontSizeError).toBeDefined();
		expect(fontSizeError?.message).toContain('at most');
	});

	it('should handle missing required fields', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				theme: { type: 'string' }
			},
			required: ['theme']
		};

		const invalidData = {};
		const result = validateSettings(invalidData, schema);

		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('Missing required property');
	});

	it('should handle nested objects', () => {
		const schema: JsonSchema = {
			type: 'object',
			properties: {
				ui: {
					type: 'object',
					properties: {
						theme: { type: 'string' },
						fontSize: { type: 'number' }
					},
					required: ['theme']
				}
			}
		};

		const invalidData = { ui: { fontSize: 14 } }; // Missing required theme
		const result = validateSettings(invalidData, schema);

		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].path).toBe('/ui');
	});

	it('should handle empty schema gracefully', () => {
		const result = validateSettings({ theme: 'dark' }, null as any);

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should handle schema compilation errors', () => {
		const invalidSchema = { type: 'invalid-type' } as JsonSchema;
		const result = validateSettings({ theme: 'dark' }, invalidSchema);

		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('Schema error');
	});
});

describe('extractWidgetHints', () => {
	it('should extract basic type hints', () => {
		const schema: JsonSchema = { type: 'string' };
		const hints = extractWidgetHints(schema);

		expect(hints.type).toBe('string');
		expect(hints.widget).toBe('text');
	});

	it('should suggest select widget for enums', () => {
		const schema: JsonSchema = {
			type: 'string',
			enum: ['light', 'dark', 'auto']
		};
		const hints = extractWidgetHints(schema);

		expect(hints.widget).toBe('select');
		expect(hints.enum).toEqual(['light', 'dark', 'auto']);
	});

	it('should suggest switch widget for booleans', () => {
		const schema: JsonSchema = { type: 'boolean' };
		const hints = extractWidgetHints(schema);

		expect(hints.widget).toBe('switch');
		expect(hints.type).toBe('boolean');
	});

	it('should extract number constraints', () => {
		const schema: JsonSchema = {
			type: 'number',
			minimum: 8,
			maximum: 72
		};
		const hints = extractWidgetHints(schema);

		expect(hints.widget).toBe('number');
		expect(hints.minimum).toBe(8);
		expect(hints.maximum).toBe(72);
	});

	it('should suggest step for integers', () => {
		const schema: JsonSchema = { type: 'integer' };
		const hints = extractWidgetHints(schema);

		expect(hints.widget).toBe('number');
		expect(hints.step).toBe(1);
	});

	it('should suggest textarea for long strings', () => {
		const schema: JsonSchema = {
			type: 'string',
			minLength: 200
		};
		const hints = extractWidgetHints(schema);

		expect(hints.widget).toBe('textarea');
	});

	it('should handle format hints', () => {
		const schema: JsonSchema = {
			type: 'string',
			format: 'email'
		};
		const hints = extractWidgetHints(schema);

		expect(hints.format).toBe('email');
		expect(hints.widget).toBe('text');
	});

	it('should suggest json widget for objects and arrays', () => {
		const objectSchema: JsonSchema = { type: 'object' };
		const arraySchema: JsonSchema = { type: 'array' };

		expect(extractWidgetHints(objectSchema).widget).toBe('json');
		expect(extractWidgetHints(arraySchema).widget).toBe('json');
	});

	it('should handle pattern placeholder', () => {
		const schema: JsonSchema = {
			type: 'string',
			pattern: '^[a-zA-Z]+$'
		};
		const hints = extractWidgetHints(schema);

		expect(hints.placeholder).toContain('Pattern:');
		expect(hints.placeholder).toContain('^[a-zA-Z]+$');
	});
});

describe('getFieldWidgetHints', () => {
	const schema: JsonSchema = {
		type: 'object',
		properties: {
			theme: {
				type: 'string',
				enum: ['light', 'dark']
			},
			ui: {
				type: 'object',
				properties: {
					fontSize: {
						type: 'number',
						minimum: 8,
						maximum: 72
					}
				}
			}
		}
	};

	it('should get hints for root level fields', () => {
		const hints = getFieldWidgetHints(schema, '/theme');

		expect(hints.widget).toBe('select');
		expect(hints.enum).toEqual(['light', 'dark']);
	});

	it('should get hints for nested fields', () => {
		const hints = getFieldWidgetHints(schema, '/ui/fontSize');

		expect(hints.widget).toBe('number');
		expect(hints.minimum).toBe(8);
		expect(hints.maximum).toBe(72);
	});

	it('should return default hints for missing fields', () => {
		const hints = getFieldWidgetHints(schema, '/nonexistent');

		expect(hints.widget).toBe('text');
	});

	it('should handle empty schema', () => {
		const hints = getFieldWidgetHints(null as any, '/theme');

		expect(hints.widget).toBe('text');
	});
});

describe('validateField', () => {
	const schema: JsonSchema = {
		type: 'object',
		properties: {
			theme: {
				type: 'string',
				enum: ['light', 'dark']
			},
			fontSize: {
				type: 'number',
				minimum: 8,
				maximum: 72
			}
		}
	};

	it('should validate individual field values', () => {
		const validResult = validateField('dark', schema, '/theme');
		expect(validResult.valid).toBe(true);

		const invalidResult = validateField('invalid', schema, '/theme');
		expect(invalidResult.valid).toBe(false);
		expect(invalidResult.errors[0].path).toBe('/theme');
	});

	it('should validate number constraints', () => {
		const validResult = validateField(14, schema, '/fontSize');
		expect(validResult.valid).toBe(true);

		const invalidResult = validateField(999, schema, '/fontSize');
		expect(invalidResult.valid).toBe(false);
		expect(invalidResult.errors[0].message).toContain('at most');
	});

	it('should handle missing field schema', () => {
		const result = validateField('value', schema, '/nonexistent');
		expect(result.valid).toBe(true);
	});
});

describe('isValidSchema', () => {
	it('should validate correct schemas', () => {
		const validSchema: JsonSchema = {
			type: 'object',
			properties: {
				theme: { type: 'string' }
			}
		};

		expect(isValidSchema(validSchema)).toBe(true);
	});

	it('should reject invalid schemas', () => {
		expect(isValidSchema(null)).toBe(false);
		expect(isValidSchema('not an object')).toBe(false);
		expect(isValidSchema({ type: 'invalid-type' })).toBe(false);
	});

	it('should handle empty object', () => {
		expect(isValidSchema({})).toBe(true); // Empty schema is valid
	});
});
