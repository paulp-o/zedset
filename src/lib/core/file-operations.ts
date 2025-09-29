import type { SettingsObject, ValidationResult, JsonSchema } from '$lib/types/index.js';
import { parseJsoncWithDocs } from '$lib/parsers/jsonc-parser.js';
import { validateSettings } from '$lib/core/validator.js';
import { diff } from '$lib/core/diff.js';

/**
 * Result of importing a settings file
 */
export interface ImportResult {
	success: boolean;
	data?: SettingsObject;
	errors: string[];
	warnings: string[];
}

/**
 * Result of exporting settings
 */
export interface ExportResult {
	success: boolean;
	json?: string;
	filename?: string;
	errors: string[];
}

/**
 * Import settings from a file
 * @param file - The uploaded file
 * @returns Promise with import result
 */
export async function importSettingsFile(file: File): Promise<ImportResult> {
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		// Validate file type
		const validExtensions = ['.json', '.jsonc'];
		const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

		if (!validExtensions.includes(fileExtension)) {
			return {
				success: false,
				errors: [`Invalid file type. Expected .json or .jsonc, got ${fileExtension}`],
				warnings: []
			};
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return {
				success: false,
				errors: [`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`],
				warnings: []
			};
		}

		// Read file content
		const content = await readFileContent(file);

		if (!content.trim()) {
			return {
				success: false,
				errors: ['File is empty'],
				warnings: []
			};
		}

		// Parse JSONC
		const parseResult = parseJsoncWithDocs(content);

		if (parseResult.errors.length > 0) {
			errors.push(...parseResult.errors);
		}

		// If we have fatal parse errors, return failure
		if (!parseResult.value || Object.keys(parseResult.value).length === 0) {
			return {
				success: false,
				errors: ['Failed to parse file: ' + errors.join(', ')],
				warnings: []
			};
		}

		// Add warnings for non-fatal parse issues
		if (parseResult.errors.length > 0) {
			warnings.push('Some parsing issues were detected but file was imported successfully');
		}

		return {
			success: true,
			data: parseResult.value,
			errors: [],
			warnings
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			errors: [`Failed to import file: ${errorMessage}`],
			warnings: []
		};
	}
}

/**
 * Import settings from text content
 * @param content - JSONC content as string
 * @param filename - Optional filename for error messages
 * @returns Import result
 */
export function importSettingsText(content: string, filename = 'settings'): ImportResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		if (!content.trim()) {
			return {
				success: false,
				errors: ['Content is empty'],
				warnings: []
			};
		}

		// Parse JSONC
		const parseResult = parseJsoncWithDocs(content);

		if (parseResult.errors.length > 0) {
			errors.push(...parseResult.errors);
		}

		// If we have fatal parse errors, return failure
		if (!parseResult.value || Object.keys(parseResult.value).length === 0) {
			return {
				success: false,
				errors: ['Failed to parse content: ' + errors.join(', ')],
				warnings: []
			};
		}

		// Add warnings for non-fatal parse issues
		if (parseResult.errors.length > 0) {
			warnings.push('Some parsing issues were detected but content was imported successfully');
		}

		return {
			success: true,
			data: parseResult.value,
			errors: [],
			warnings
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			errors: [`Failed to parse content: ${errorMessage}`],
			warnings: []
		};
	}
}

/**
 * Export settings as clean delta-only JSON
 * @param effectiveSettings - Current effective settings
 * @param defaultSettings - Default settings to diff against
 * @param schema - Optional schema for validation
 * @returns Export result with JSON string
 */
export function exportSettings(
	effectiveSettings: SettingsObject,
	defaultSettings: SettingsObject,
	schema?: JsonSchema
): ExportResult {
	const errors: string[] = [];

	try {
		// Validate settings if schema is provided
		if (schema) {
			const validation = validateSettings(effectiveSettings, schema);
			if (!validation.valid) {
				return {
					success: false,
					errors: [
						'Cannot export settings with validation errors:',
						...validation.errors.map((err) => `- ${err.message} (at ${err.path})`)
					]
				};
			}
		}

		// Generate delta (only changed values)
		// Use the same logic as the UI's changed paths detection
		const delta = diff(effectiveSettings, defaultSettings);

		// If no changes, export empty object
		if (Object.keys(delta).length === 0) {
			return {
				success: true,
				json: '{}',
				filename: generateFilename(),
				errors: []
			};
		}

		// Convert to pretty-printed JSON with stable key ordering
		const json = JSON.stringify(delta, null, 2);

		return {
			success: true,
			json,
			filename: generateFilename(),
			errors: []
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			success: false,
			errors: [`Failed to export settings: ${errorMessage}`]
		};
	}
}

/**
 * Download a file with given content
 * @param content - File content
 * @param filename - Filename for download
 * @param mimeType - MIME type (defaults to application/json)
 */
export function downloadFile(
	content: string,
	filename: string,
	mimeType = 'application/json'
): void {
	try {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.style.display = 'none';

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up the object URL
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Failed to download file:', error);
		throw new Error('Failed to download file');
	}
}

/**
 * Validate a settings object against defaults and schema
 * @param settings - Settings to validate
 * @param defaults - Default settings for comparison
 * @param schema - Optional schema for validation
 * @returns Validation result with additional metadata
 */
export function validateImportedSettings(
	settings: SettingsObject,
	defaults: SettingsObject,
	schema?: JsonSchema
): ValidationResult & { unknownKeys: string[]; summary: string } {
	const unknownKeys: string[] = [];

	// Find keys that don't exist in defaults
	function findUnknownKeys(obj: SettingsObject, defaultObj: SettingsObject, path = ''): void {
		for (const key in obj) {
			const currentPath = path ? `${path}.${key}` : key;

			if (!(key in defaultObj)) {
				unknownKeys.push(currentPath);
			} else if (
				typeof obj[key] === 'object' &&
				obj[key] !== null &&
				typeof defaultObj[key] === 'object' &&
				defaultObj[key] !== null &&
				!Array.isArray(obj[key])
			) {
				findUnknownKeys(obj[key] as SettingsObject, defaultObj[key] as SettingsObject, currentPath);
			}
		}
	}

	findUnknownKeys(settings, defaults);

	// Run schema validation if provided
	let validation: ValidationResult = { valid: true, errors: [], fieldErrors: {} };
	if (schema) {
		validation = validateSettings(settings, schema);
	}

	// Generate summary
	const totalKeys = Object.keys(settings).length;
	const unknownCount = unknownKeys.length;
	const errorCount = validation.errors.length;

	let summary = `Found ${totalKeys} setting${totalKeys !== 1 ? 's' : ''}`;
	if (unknownCount > 0) {
		summary += `, ${unknownCount} unknown key${unknownCount !== 1 ? 's' : ''}`;
	}
	if (errorCount > 0) {
		summary += `, ${errorCount} validation error${errorCount !== 1 ? 's' : ''}`;
	}

	return {
		...validation,
		unknownKeys,
		summary
	};
}

/**
 * Generate a filename for exported settings
 */
function generateFilename(): string {
	// const now = new Date();
	// const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
	return `settings.json`;
}

/**
 * Read file content as text
 */
function readFileContent(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			const result = event.target?.result;
			if (typeof result === 'string') {
				resolve(result);
			} else {
				reject(new Error('Failed to read file as text'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}
