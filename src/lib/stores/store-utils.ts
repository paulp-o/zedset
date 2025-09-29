import type { SettingsObject } from '$lib/types/index.js';

/**
 * Utility functions for store operations
 */

// Memoization cache for getAllPaths
const pathsCache = new WeakMap<SettingsObject, Map<string, string[]>>();

/**
 * Get all field paths from a settings object (memoized)
 */
export function getAllPaths(obj: SettingsObject, prefix = ''): string[] {
	// Check cache first
	if (!pathsCache.has(obj)) {
		pathsCache.set(obj, new Map());
	}

	const objCache = pathsCache.get(obj)!;
	if (objCache.has(prefix)) {
		return objCache.get(prefix)!;
	}
	const paths: string[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const currentPath = prefix ? `${prefix}.${key}` : key;

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			// For objects, only recurse to get nested paths - never include the object itself
			const nestedPaths = getAllPaths(value as SettingsObject, currentPath);
			if (nestedPaths.length > 0) {
				// Has children - only include the children, never the parent
				paths.push(...nestedPaths);
			} else {
				// Empty object with no children - this is atomic, include it
				paths.push(currentPath);
			}
		} else {
			// Atomic value (string, number, boolean, array, null)
			paths.push(currentPath);
		}
	}

	// Cache the result before returning
	objCache.set(prefix, paths);
	return paths;
}

/**
 * Get value at a specific path in an object
 */
export function getValueByPath(obj: SettingsObject, path: string): unknown {
	const parts = path.split('.');
	let current: unknown = obj;

	for (const part of parts) {
		if (current && typeof current === 'object' && !Array.isArray(current)) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}

	return current;
}

/**
 * Check if a path exists in an object
 */
export function hasPath(obj: SettingsObject, path: string): boolean {
	const parts = path.split('.');
	let current: unknown = obj;

	for (const part of parts) {
		if (current && typeof current === 'object' && !Array.isArray(current)) {
			const record = current as Record<string, unknown>;
			if (!(part in record)) {
				return false;
			}
			current = record[part];
		} else {
			return false;
		}
	}

	return true;
}

/**
 * Get the parent path of a given path
 */
export function getParentPath(path: string): string | null {
	const lastDotIndex = path.lastIndexOf('.');
	return lastDotIndex > 0 ? path.substring(0, lastDotIndex) : null;
}

/**
 * Get all parent paths for a given path (including the path itself)
 */
export function getAllParentPaths(path: string): string[] {
	const paths: string[] = [path];
	let current = path;

	while (true) {
		const parent = getParentPath(current);
		if (parent === null) break;
		paths.unshift(parent);
		current = parent;
	}

	return paths;
}

/**
 * Group paths by their top-level key
 */
export function groupPathsBySection(paths: string[]): Record<string, string[]> {
	const groups: Record<string, string[]> = {};

	for (const path of paths) {
		const topLevel = path.split('.')[0];
		if (!groups[topLevel]) {
			groups[topLevel] = [];
		}
		groups[topLevel].push(path);
	}

	return groups;
}

/**
 * Convert a path to a human-readable label
 */
export function pathToLabel(path: string): string {
	return path
		.split('.')
		.map((part) => part.replace(/[_-]/g, ' '))
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' › ');
}

/**
 * Get the leaf key from a path
 */
export function getLeafKey(path: string): string {
	const parts = path.split('.');
	return parts[parts.length - 1];
}

/**
 * Check if one path is an ancestor of another
 */
export function isAncestorPath(ancestor: string, descendant: string): boolean {
	if (ancestor === descendant) return false;
	return descendant.startsWith(ancestor + '.');
}

/**
 * Filter paths that match a search query
 */
export function filterPathsBySearch(
	paths: string[],
	query: string,
	docsMap: Record<string, string> = {}
): string[] {
	const normalizedQuery = query.toLowerCase().trim();
	if (!normalizedQuery || normalizedQuery.length < 3) return paths;

	return paths.filter((path) => {
		// Search in path
		if (path.toLowerCase().includes(normalizedQuery)) {
			return true;
		}

		// Search in documentation
		const docs = docsMap[path];
		if (docs && docs.toLowerCase().includes(normalizedQuery)) {
			return true;
		}

		// Search in label
		const label = pathToLabel(path);
		if (label.toLowerCase().includes(normalizedQuery)) {
			return true;
		}

		return false;
	});
}
