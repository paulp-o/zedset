import type { SettingsObject } from '$lib/types';

/**
 * Type guard to check if a value is a plain object (not array, null, or primitive)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safe cloning that works with Svelte 5 proxy objects
 */
function safeClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Deep merge two settings objects, with user values taking precedence over defaults.
 * Arrays are replaced entirely (not merged element-wise).
 *
 * @param defaults - The default settings object
 * @param user - The user settings object (takes precedence)
 * @returns The merged effective settings object
 */
export function merge(defaults: SettingsObject, user: SettingsObject): SettingsObject {
	// Handle null/undefined inputs
	if (!defaults && !user) return {};
	if (!defaults) return safeClone(user);

	// If user settings are empty, return defaults as-is to preserve reference equality
	if (!user || Object.keys(user).length === 0) return defaults;

	const result: SettingsObject = {};

	// Start with all keys from defaults
	const allKeys = new Set([...Object.keys(defaults), ...Object.keys(user)]);

	for (const key of allKeys) {
		const defaultValue = defaults[key];
		const userValue = user[key];

		if (userValue === undefined) {
			// User didn't provide this key, use default (avoid cloning if possible)
			if (
				typeof defaultValue === 'object' &&
				defaultValue !== null &&
				!Array.isArray(defaultValue)
			) {
				result[key] = safeClone(defaultValue);
			} else {
				result[key] = defaultValue; // Primitives can be shared safely
			}
		} else if (defaultValue === undefined) {
			// User provided a key that doesn't exist in defaults
			result[key] = safeClone(userValue);
		} else if (isPlainObject(defaultValue) && isPlainObject(userValue)) {
			// Both are plain objects, recursively merge
			result[key] = merge(defaultValue, userValue);
		} else {
			// User value takes precedence (includes arrays, primitives, null)
			if (typeof userValue === 'object' && userValue !== null) {
				result[key] = safeClone(userValue);
			} else {
				result[key] = userValue; // Primitives can be shared safely
			}
		}
	}

	return result;
}

/**
 * Shallow merge - only merges top-level properties
 * Useful for cases where you don't want deep merging behavior
 */
export function shallowMerge(defaults: SettingsObject, user: SettingsObject): SettingsObject {
	if (!defaults && !user) return {};
	if (!defaults) return safeClone(user);
	if (!user) return safeClone(defaults);

	return {
		...safeClone(defaults),
		...safeClone(user)
	};
}

/**
 * Merges multiple settings objects in order, with later objects taking precedence
 */
export function mergeMultiple(...objects: SettingsObject[]): SettingsObject {
	return objects.reduce((acc, obj) => merge(acc, obj || {}), {});
}
