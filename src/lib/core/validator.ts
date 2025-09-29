import Ajv from 'ajv';
import type {
	JsonSchema,
	ValidationResult,
	FieldValidationError,
	WidgetHints,
	JsonPointer,
	SettingsObject
} from '$lib/types';

/**
 * AJV instance configured for settings validation
 */
const ajv = new Ajv({
	allErrors: true, // Collect all errors, not just the first one
	verbose: true, // Include schema and data in error objects
	strict: false, // Allow some schema features that aren't strict JSON Schema
	removeAdditional: false, // Don't remove additional properties
	useDefaults: false, // Don't modify data with defaults
	coerceTypes: false // Don't coerce types automatically
});

/**
 * Validates settings object against a JSON Schema
 * @param data - The settings object to validate
 * @param schema - The JSON Schema to validate against
 * @returns Validation result with field-level errors
 */
export function validateSettings(data: SettingsObject, schema: JsonSchema): ValidationResult {
	if (!schema) {
		return {
			valid: true,
			errors: [],
			fieldErrors: {}
		};
	}

	try {
		// Compile the schema
		const validate = ajv.compile(schema);
		const valid = validate(data);

		if (valid) {
			return {
				valid: true,
				errors: [],
				fieldErrors: {}
			};
		}

		// Convert AJV errors to our format
		const errors: FieldValidationError[] = (validate.errors || []).map((error) => ({
			path: error.instancePath || '/',
			message: formatErrorMessage(error),
			value: error.data,
			schemaPath: error.schemaPath || ''
		}));

		// Group errors by field path
		const fieldErrors: Record<string, FieldValidationError[]> = {};
		for (const error of errors) {
			if (!fieldErrors[error.path]) {
				fieldErrors[error.path] = [];
			}
			fieldErrors[error.path].push(error);
		}

		return {
			valid: false,
			errors,
			fieldErrors
		};
	} catch (error) {
		// Schema compilation error
		const errorMessage = error instanceof Error ? error.message : 'Unknown schema error';
		const schemaError = {
			path: '/',
			message: `Schema error: ${errorMessage}`,
			value: data,
			schemaPath: ''
		};
		return {
			valid: false,
			errors: [schemaError],
			fieldErrors: { '/': [schemaError] }
		};
	}
}

/**
 * Formats AJV error messages for user display
 */
function formatErrorMessage(error: any): string {
	const { keyword, message, params } = error;

	switch (keyword) {
		case 'required':
			return `Missing required property: ${params.missingProperty}`;

		case 'type':
			return `Expected ${params.type}, got ${typeof error.data}`;

		case 'enum':
			return `Value must be one of: ${params.allowedValues.join(', ')}`;

		case 'minimum':
			return `Value must be at least ${params.limit}`;

		case 'maximum':
			return `Value must be at most ${params.limit}`;

		case 'minLength':
			return `Text must be at least ${params.limit} characters`;

		case 'maxLength':
			return `Text must be at most ${params.limit} characters`;

		case 'pattern':
			return `Value does not match required pattern`;

		case 'format':
			return `Invalid ${params.format} format`;

		case 'additionalProperties':
			return `Additional property '${params.additionalProperty}' is not allowed`;

		default:
			return message || 'Invalid value';
	}
}

/**
 * Extracts widget hints from a JSON Schema property
 * @param schema - The schema property to extract hints from
 * @returns Widget hints for UI rendering
 */
export function extractWidgetHints(schema: JsonSchema): WidgetHints {
	const hints: WidgetHints = {};

	// Basic type
	if (schema.type) {
		hints.type = Array.isArray(schema.type) ? (schema.type[0] as any) : (schema.type as any);
	}

	// Enum values for select widgets
	if (schema.enum) {
		hints.enum = schema.enum;
		hints.widget = 'select';
	}

	// Number constraints
	if (typeof schema.minimum === 'number') {
		hints.minimum = schema.minimum;
	}
	if (typeof schema.maximum === 'number') {
		hints.maximum = schema.maximum;
	}

	// String constraints
	if (typeof schema.minLength === 'number' && schema.minLength > 100) {
		hints.widget = 'textarea'; // Long text likely needs textarea
	}

	// Format hints
	if (schema.format) {
		hints.format = schema.format;

		// Auto-select widgets based on format
		switch (schema.format) {
			case 'email':
			case 'uri':
			case 'hostname':
				hints.widget = 'text';
				break;
		}
	}

	// Pattern for validation
	if (schema.pattern) {
		hints.placeholder = 'Pattern: ' + schema.pattern;
	}

	// Widget selection based on type
	if (!hints.widget) {
		switch (hints.type) {
			case 'boolean':
				hints.widget = 'switch';
				break;
			case 'number':
			case 'integer':
				hints.widget = 'number';
				// Add step for integers
				if (hints.type === 'integer') {
					hints.step = 1;
				}
				break;
			case 'string':
				hints.widget = 'text';
				break;
			case 'object':
			case 'array':
				hints.widget = 'json';
				break;
			default:
				hints.widget = 'text';
		}
	}

	return hints;
}

/**
 * Gets widget hints for a specific field path in the schema
 * @param schema - The root schema
 * @param path - JSON pointer to the field
 * @returns Widget hints for the field, or default hints if not found
 */
export function getFieldWidgetHints(schema: JsonSchema, path: JsonPointer): WidgetHints {
	if (!schema || !path) {
		return { widget: 'text' };
	}

	// Navigate to the field schema
	const fieldSchema = getSchemaAtPath(schema, path);
	if (!fieldSchema) {
		return { widget: 'text' };
	}

	return extractWidgetHints(fieldSchema);
}

/**
 * Navigates to a specific field schema using a JSON pointer
 */
function getSchemaAtPath(schema: JsonSchema, path: JsonPointer): JsonSchema | null {
	if (!path || path === '') return schema;

	const components = path.split('/').filter(Boolean);
	let current = schema;

	for (const component of components) {
		if (!current.properties || !current.properties[component]) {
			return null;
		}
		current = current.properties[component];
	}

	return current;
}

/**
 * Validates a single field value against its schema
 * @param value - The field value to validate
 * @param schema - The root schema
 * @param path - JSON pointer to the field
 * @returns Validation result for the field
 */
export function validateField(
	value: unknown,
	schema: JsonSchema,
	path: JsonPointer
): ValidationResult {
	const fieldSchema = getSchemaAtPath(schema, path);

	if (!fieldSchema) {
		return { valid: true, errors: [], fieldErrors: {} };
	}

	// Create a temporary object to validate just this field
	const tempData = { fieldValue: value };
	const tempSchema = {
		type: 'object',
		properties: {
			fieldValue: fieldSchema
		}
	};

	const result = validateSettings(tempData, tempSchema);

	// Adjust error paths to match the original field path
	if (!result.valid) {
		result.errors = result.errors.map((error) => ({
			...error,
			path: path
		}));
	}

	return result;
}

/**
 * Checks if a schema exists and is valid
 * @param schema - The schema to check
 * @returns True if schema is valid, false otherwise
 */
export function isValidSchema(schema: unknown): schema is JsonSchema {
	if (!schema || typeof schema !== 'object') {
		return false;
	}

	try {
		ajv.compile(schema as JsonSchema);
		return true;
	} catch {
		return false;
	}
}
