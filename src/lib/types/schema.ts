/**
 * JSON Schema and validation types
 */

import type { ErrorObject } from 'ajv';
import type { JsonPointer } from './settings.js';

// Standard JSON Schema object
export interface JsonSchema {
	$schema?: string;
	type?: string | string[];
	properties?: Record<string, JsonSchema>;
	items?: JsonSchema | JsonSchema[];
	enum?: unknown[];
	const?: unknown;
	oneOf?: JsonSchema[];
	anyOf?: JsonSchema[];
	allOf?: JsonSchema[];
	minimum?: number;
	maximum?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: string;
	required?: string[];
	additionalProperties?: boolean | JsonSchema;
	title?: string;
	description?: string;
	default?: unknown;
	examples?: unknown[];
}

// Validation result for a single field
export interface FieldValidationError {
	path: JsonPointer;
	message: string;
	value: unknown;
	schemaPath: string;
}

// Overall validation result
export interface ValidationResult {
	valid: boolean;
	errors: FieldValidationError[];
	fieldErrors: Record<string, FieldValidationError[]>;
}

// Widget hints extracted from schema
export interface WidgetHints {
	type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
	widget?: 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'json';
	enum?: unknown[];
	minimum?: number;
	maximum?: number;
	step?: number;
	placeholder?: string;
	format?: string;
}
