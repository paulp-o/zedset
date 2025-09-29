import type { SettingsObject, JsonPointer } from '$lib/types';

/**
 * Type guard to check if a value is a plain object (not array, null, or primitive)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		value.constructor === Object
	);
}

/**
 * Safe cloning that works with Svelte 5 proxy objects
 */
function safeClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Deep equality check for two values
 */
function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;

	if (a === null || b === null || a === undefined || b === undefined) {
		return a === b;
	}

	if (typeof a !== typeof b) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, index) => deepEqual(item, b[index]));
	}

	if (isPlainObject(a) && isPlainObject(b)) {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) return false;

		return keysA.every((key) => deepEqual(a[key], b[key]));
	}

	return false;
}

/**
 * Computes the difference between effective settings and defaults.
 * Returns only the fields that have changed from their default values.
 *
 * @param effective - The current effective settings (merged defaults + user)
 * @param defaults - The default settings
 * @returns Object containing only the changed fields
 */
export function diff(effective: SettingsObject, defaults: SettingsObject): SettingsObject {
	if (!effective && !defaults) return {};
	if (!effective) return {};
	if (!defaults) return safeClone(effective);

	// If effective and defaults are the same reference, no changes exist
	if (effective === defaults) return {};

	const result: SettingsObject = {};

	for (const [key, effectiveValue] of Object.entries(effective)) {
		const defaultValue = defaults[key];

		if (!deepEqual(effectiveValue, defaultValue)) {
			// Value has changed from default
			result[key] = safeClone(effectiveValue);
		}
	}

	return result;
}

/**
 * Computes a detailed diff that includes information about what changed.
 * Returns an object with added, modified, and removed keys.
 */
export interface DetailedDiffResult {
	/** Keys that exist in effective but not in defaults */
	added: string[];
	/** Keys that exist in both but have different values */
	modified: string[];
	/** Keys that exist in defaults but not in effective */
	removed: string[];
	/** The actual delta object (same as diff() result) */
	delta: SettingsObject;
}

export function detailedDiff(
	effective: SettingsObject,
	defaults: SettingsObject
): DetailedDiffResult {
	if (!effective && !defaults) {
		return { added: [], modified: [], removed: [], delta: {} };
	}

	const added: string[] = [];
	const modified: string[] = [];
	const removed: string[] = [];
	const delta: SettingsObject = {};

	// Find added and modified keys
	if (effective) {
		for (const [key, effectiveValue] of Object.entries(effective)) {
			const defaultValue = defaults?.[key];

			if (defaultValue === undefined) {
				// Key exists in effective but not defaults
				added.push(key);
				delta[key] = safeClone(effectiveValue);
			} else if (!deepEqual(effectiveValue, defaultValue)) {
				// Key exists in both but values differ
				modified.push(key);
				delta[key] = safeClone(effectiveValue);
			}
		}
	}

	// Find removed keys
	if (defaults) {
		for (const key of Object.keys(defaults)) {
			if (effective?.[key] === undefined) {
				removed.push(key);
			}
		}
	}

	return { added, modified, removed, delta };
}

/**
 * Gets all JSON pointers to fields that have changed from defaults
 */
export function getChangedPaths(
	effective: SettingsObject,
	defaults: SettingsObject,
	basePath = ''
): Set<JsonPointer> {
	const changedPaths = new Set<JsonPointer>();

	if (!effective && !defaults) return changedPaths;

	const allKeys = new Set([...Object.keys(effective || {}), ...Object.keys(defaults || {})]);

	for (const key of allKeys) {
		const currentPath = basePath ? `${basePath}/${key}` : `/${key}`;
		const effectiveValue = effective?.[key];
		const defaultValue = defaults?.[key];

		if (!deepEqual(effectiveValue, defaultValue)) {
			changedPaths.add(currentPath);

			// If both values are plain objects, also check nested paths
			if (isPlainObject(effectiveValue) && isPlainObject(defaultValue)) {
				const nestedPaths = getChangedPaths(effectiveValue, defaultValue, currentPath);
				nestedPaths.forEach((path) => changedPaths.add(path));
			}
		}
	}

	return changedPaths;
}

/**
 * Checks if any field in the given object differs from defaults
 */
export function hasChanges(effective: SettingsObject, defaults: SettingsObject): boolean {
	const deltaObj = diff(effective, defaults);
	return Object.keys(deltaObj).length > 0;
}

/**
 * Computes a detailed diff specifically for additive settings systems.
 * Only compares user-overridden values against defaults.
 * Does not show "removed" items since missing properties simply use defaults.
 */
export function settingsDetailedDiff(
	userSettings: SettingsObject,
	defaults: SettingsObject
): DetailedDiffResult {
	if (!userSettings && !defaults) {
		return { added: [], modified: [], removed: [], delta: {} };
	}

	const added: string[] = [];
	const modified: string[] = [];
	const removed: string[] = []; // Should remain empty for additive settings
	const delta: SettingsObject = {};

	// Get all paths from user settings (flattened)
	const userPaths = getAllPathsFromObject(userSettings || {});

	for (const path of userPaths) {
		const userValue = getValueByPath(userSettings || {}, path);
		const defaultValue = getValueByPath(defaults || {}, path);

		if (defaultValue === undefined) {
			// User has set a property that doesn't exist in defaults (new setting)
			added.push(path);
			setValueByPath(delta, path, safeClone(userValue));
		} else if (!deepEqual(userValue, defaultValue)) {
			// User has overridden a default value
			modified.push(path);
			setValueByPath(delta, path, safeClone(userValue));
		}
		// If userValue equals defaultValue, it's not a change (don't include)
	}

	return { added, modified, removed, delta };
}

/**
 * Get all dot-notation paths from a nested object
 */
function getAllPathsFromObject(obj: SettingsObject, prefix = ''): string[] {
	const paths: string[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const currentPath = prefix ? `${prefix}.${key}` : key;

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			// Add the object path itself
			paths.push(currentPath);
			// Add nested paths
			paths.push(...getAllPathsFromObject(value as SettingsObject, currentPath));
		} else {
			// Leaf value
			paths.push(currentPath);
		}
	}

	return paths;
}

/**
 * Get value at a dot-notation path
 */
function getValueByPath(obj: SettingsObject, path: string): unknown {
	return path.split('.').reduce((current: any, key) => current?.[key], obj);
}

/**
 * Set value at a dot-notation path, creating nested objects as needed
 */
function setValueByPath(obj: SettingsObject, path: string, value: unknown): void {
	const parts = path.split('.');
	let current = obj;

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
			current[part] = {};
		}
		current = current[part] as SettingsObject;
	}

	current[parts[parts.length - 1]] = value;
}
