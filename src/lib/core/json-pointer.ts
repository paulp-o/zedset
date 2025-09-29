import type { JsonPointer, SettingsObject } from '$lib/types';

/**
 * Safe cloning that works with Svelte 5 proxy objects
 */
function safeClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Escapes a string for use in a JSON Pointer component
 * Per RFC 6901: ~ becomes ~0, / becomes ~1
 */
function escapePointerComponent(component: string): string {
	return component.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescapes a JSON Pointer component
 * Per RFC 6901: ~1 becomes /, ~0 becomes ~
 */
function unescapePointerComponent(component: string): string {
	return component.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Parses a JSON Pointer into an array of path components
 * @param pointer - JSON Pointer string (e.g., "/theme/mode")
 * @returns Array of unescaped path components
 */
export function parsePointer(pointer: JsonPointer): string[] {
	if (!pointer) return [];

	// Special case: "/" means root with empty string component
	if (pointer === '/') return [''];

	// Remove leading slash and split by slash
	const trimmed = pointer.startsWith('/') ? pointer.slice(1) : pointer;

	if (!trimmed) return [];

	return trimmed.split('/').map(unescapePointerComponent);
}

/**
 * Creates a JSON Pointer from an array of path components
 * @param components - Array of path components
 * @returns JSON Pointer string
 */
export function createPointer(components: string[]): JsonPointer {
	if (!components.length) return '';
	return '/' + components.map(escapePointerComponent).join('/');
}

/**
 * Gets a value from an object using a JSON Pointer
 * @param obj - The object to traverse
 * @param pointer - JSON Pointer to the desired value
 * @returns The value at the pointer, or undefined if not found
 */
export function getByPointer(obj: SettingsObject, pointer: JsonPointer): unknown {
	if (!obj) return undefined;
	if (!pointer || pointer === '') return obj;

	const components = parsePointer(pointer);
	let current: unknown = obj;

	for (const component of components) {
		if (current === null || current === undefined) return undefined;

		if (typeof current !== 'object') return undefined;

		if (Array.isArray(current)) {
			const index = parseInt(component, 10);
			if (isNaN(index) || index < 0 || index >= current.length) return undefined;
			current = current[index];
		} else {
			current = (current as Record<string, unknown>)[component];
		}
	}

	return current;
}

/**
 * Sets a value in an object using a JSON Pointer
 * Creates intermediate objects/arrays as needed
 * @param obj - The object to modify
 * @param pointer - JSON Pointer to the location to set
 * @param value - The value to set
 * @returns A new object with the value set (does not mutate original)
 */
export function setByPointer(
	obj: SettingsObject,
	pointer: JsonPointer,
	value: unknown
): SettingsObject {
	if (!pointer) return obj;

	const components = parsePointer(pointer);
	if (!components.length) return obj;

	// Deep clone the object to avoid mutation
	const result = safeClone(obj);
	let current: any = result;

	// Navigate to the parent of the target
	for (let i = 0; i < components.length - 1; i++) {
		const component = components[i];
		const nextComponent = components[i + 1];

		if (current[component] === undefined || current[component] === null) {
			// Create intermediate object or array based on next component
			const isNextComponentArrayIndex = /^\d+$/.test(nextComponent);
			current[component] = isNextComponentArrayIndex ? [] : {};
		}

		current = current[component];
	}

	// Set the final value
	const lastComponent = components[components.length - 1];
	current[lastComponent] = value;

	return result;
}

/**
 * Removes a value from an object using a JSON Pointer
 * @param obj - The object to modify
 * @param pointer - JSON Pointer to the location to remove
 * @returns A new object with the value removed (does not mutate original)
 */
export function removeByPointer(obj: SettingsObject, pointer: JsonPointer): SettingsObject {
	if (!pointer || !obj) return obj;

	const components = parsePointer(pointer);
	if (!components.length) return obj;

	// Deep clone the object to avoid mutation
	const result = safeClone(obj);
	let current: any = result;

	// Navigate to the parent of the target
	for (let i = 0; i < components.length - 1; i++) {
		const component = components[i];

		if (current[component] === undefined || current[component] === null) {
			// Path doesn't exist, nothing to remove
			return result;
		}

		current = current[component];
	}

	// Remove the final property
	const lastComponent = components[components.length - 1];
	if (Array.isArray(current)) {
		const index = parseInt(lastComponent, 10);
		if (!isNaN(index) && index >= 0 && index < current.length) {
			current.splice(index, 1);
		}
	} else if (typeof current === 'object' && current !== null) {
		delete current[lastComponent];
	}

	return result;
}

/**
 * Checks if a JSON Pointer exists in an object
 * @param obj - The object to check
 * @param pointer - JSON Pointer to check
 * @returns True if the pointer exists, false otherwise
 */
export function hasPointer(obj: SettingsObject, pointer: JsonPointer): boolean {
	const value = getByPointer(obj, pointer);
	return value !== undefined;
}

/**
 * Gets the parent pointer of a given JSON Pointer
 * @param pointer - The JSON Pointer
 * @returns The parent pointer, or empty string if at root
 */
export function getParentPointer(pointer: JsonPointer): JsonPointer {
	const components = parsePointer(pointer);
	if (components.length <= 1) return '';
	return createPointer(components.slice(0, -1));
}

/**
 * Gets the last component (property name) of a JSON Pointer
 * @param pointer - The JSON Pointer
 * @returns The last component, or empty string if pointer is empty
 */
export function getPointerProperty(pointer: JsonPointer): string {
	const components = parsePointer(pointer);
	return components.length > 0 ? components[components.length - 1] : '';
}

/**
 * Validates that a string is a valid JSON Pointer
 * @param pointer - The string to validate
 * @returns True if valid, false otherwise
 */
export function isValidPointer(pointer: string): pointer is JsonPointer {
	if (typeof pointer !== 'string') return false;

	// Empty string is valid (root)
	if (pointer === '') return true;

	// Must start with /
	if (!pointer.startsWith('/')) return false;

	// Try to parse and see if it throws
	try {
		parsePointer(pointer);
		return true;
	} catch {
		return false;
	}
}
