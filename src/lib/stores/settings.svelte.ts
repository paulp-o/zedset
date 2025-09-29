/* eslint-disable */
// This file uses Svelte 5 patterns with regular Sets for reactive state
// The linter rule suggesting SvelteSet is outdated for Svelte 5
import type { SettingsObject, JsonSchema } from '$lib/types/index.js';
import { merge } from '$lib/core/merge.js';
import { diff } from '$lib/core/diff.js';
import { validateSettings } from '$lib/core/validator.js';
import { fetchDefaultSettings, parseJsoncWithDocs } from '$lib/parsers/jsonc-parser.js';
import { getAllPaths } from './store-utils.js';

interface SettingsState {
	defaults: SettingsObject;
	user: SettingsObject;
	schema: JsonSchema | null;
	docsMap: Record<string, string>;
	loading: boolean;
	error: string | null;
}

class SettingsStore {
	// Core state using Svelte 5 runes
	private state = $state<SettingsState>({
		defaults: {},
		user: {},
		schema: null,
		docsMap: {},
		loading: false,
		error: null
	});

	// Cached atomic paths for performance (non-reactive cache)
	private atomicPathsCache = {
		allPaths: [] as string[],
		hasChildrenSet: new Set<string>(),
		lastDefaultsRef: null as SettingsObject | null,
		lastUserRef: null as SettingsObject | null
	};

	// Derived computations - clean and reactive
	private derived = $derived(() => {
		const effective = merge(this.state.defaults, this.state.user);
		// Delta should only include user-changed values, not all effective vs defaults
		const delta = diff(this.state.user, this.state.defaults);
		const validation = this.state.schema
			? validateSettings(effective, this.state.schema)
			: { valid: true, errors: [], fieldErrors: {} };

		// Compute changed paths efficiently (no state mutations)
		const changedPaths = this._computeChangedPaths();

		// Compute custom paths (keys that exist in user but not in defaults)
		const customPaths = this._computeCustomPaths();

		return { effective, delta, validation, changedPaths, customPaths };
	});

	// Getters for reactive access
	get defaults() {
		return this.state.defaults;
	}
	get user() {
		return this.state.user;
	}
	get schema() {
		return this.state.schema;
	}
	get docsMap() {
		return this.state.docsMap;
	}
	get loading() {
		return this.state.loading;
	}
	get error() {
		return this.state.error;
	}

	get effective() {
		return this.derived().effective;
	}
	get delta() {
		return this.derived().delta;
	}
	get validation() {
		return this.derived().validation;
	}
	get changedPaths() {
		return this.derived().changedPaths;
	}
	get customPaths() {
		return this.derived().customPaths;
	}

	// Cached atomic paths getters
	get allAtomicPaths() {
		this._updateAtomicPathsCache(); // Update cache on access
		return this.atomicPathsCache.allPaths;
	}

	get hasChildrenSet() {
		this._updateAtomicPathsCache(); // Update cache on access
		return this.atomicPathsCache.hasChildrenSet;
	}

	// Actions
	async loadDefaults(): Promise<void> {
		this.state.loading = true;
		this.state.error = null;

		try {
			const defaultsContent = await fetchDefaultSettings();
			const { value, docs } = parseJsoncWithDocs(defaultsContent);

			this.state.defaults = value;
			this.state.docsMap = docs;
		} catch (err) {
			this.state.error = err instanceof Error ? err.message : 'Failed to load defaults';
			console.error('Failed to load defaults:', err);
		} finally {
			this.state.loading = false;
		}
	}

	loadSchema(schema: JsonSchema): void {
		this.state.schema = schema;
	}

	loadUserSettings(userSettings: SettingsObject): void {
		this.state.user = { ...userSettings };
	}

	// Get documentation for a path, checking parent paths if needed
	getDocumentation(path: string): string {
		// First try exact match
		if (this.state.docsMap[path]) {
			return this.state.docsMap[path];
		}

		// Try parent paths (e.g., for "theme.mode", try "theme")
		const parts = path.split('.');
		for (let i = parts.length - 1; i > 0; i--) {
			const parentPath = parts.slice(0, i).join('.');
			if (this.state.docsMap[parentPath]) {
				return this.state.docsMap[parentPath];
			}
		}

		// Try without dots (our parser stores simple property names)
		if (parts.length > 0 && this.state.docsMap[parts[0]]) {
			return this.state.docsMap[parts[0]];
		}

		return '';
	}

	updateUserSetting(path: string, value: unknown): void {
		// Use structural sharing for performance
		const updated = this._cloneWithStructuralSharing(this.state.user, path, value, 'set');
		this.state.user = updated;
	}

	resetUserSetting(path: string): void {
		// Use structural sharing for performance
		const updated = this._cloneWithStructuralSharing(this.state.user, path, undefined, 'delete');
		this.state.user = updated;
	}

	resetAllUserSettings(): void {
		this.state.user = {};
	}

	resetSection(sectionPath: string): void {
		// Use structural sharing for performance
		const updated = this._cloneWithStructuralSharing(
			this.state.user,
			sectionPath,
			undefined,
			'delete'
		);
		this.state.user = updated;
	}

	// Helper methods
	private _cloneWithStructuralSharing(
		obj: SettingsObject,
		path: string,
		value: unknown,
		operation: 'set' | 'delete'
	): SettingsObject {
		const parts = path.split('.');

		// If it's a top-level operation, handle it simply
		if (parts.length === 1) {
			const result = { ...obj };
			if (operation === 'set') {
				result[parts[0]] = value;
			} else {
				delete result[parts[0]];
			}
			return result;
		}

		// For nested paths, only clone the path that needs to change
		const [first, ...rest] = parts;
		const restPath = rest.join('.');

		const result = { ...obj };

		if (!(first in result) || typeof result[first] !== 'object' || result[first] === null) {
			if (operation === 'delete') {
				return result; // Nothing to delete
			}
			result[first] = {};
		} else {
			// Clone only this level
			result[first] = { ...(result[first] as SettingsObject) };
		}

		// Recursively apply the operation
		if (operation === 'set') {
			result[first] = this._cloneWithStructuralSharing(
				result[first] as SettingsObject,
				restPath,
				value,
				operation
			);
		} else {
			result[first] = this._cloneWithStructuralSharing(
				result[first] as SettingsObject,
				restPath,
				value,
				operation
			);

			// Clean up empty objects
			if (Object.keys(result[first] as SettingsObject).length === 0) {
				delete result[first];
			}
		}

		return result;
	}

	private _updateAtomicPathsCache(): void {
		// Check if cache needs updating (reference equality check)
		if (
			this.atomicPathsCache.lastDefaultsRef === this.state.defaults &&
			this.atomicPathsCache.lastUserRef === this.state.user
		) {
			return; // Cache is still valid
		}

		// Update cache - get only atomic (leaf) paths
		const defaultPaths = getAllPaths(this.state.defaults);
		const userPaths = getAllPaths(this.state.user);

		// Combine and deduplicate atomic paths
		const allPathsSet = new Set([...defaultPaths, ...userPaths]);
		this.atomicPathsCache.allPaths = Array.from(allPathsSet);

		// Build hasChildren set by checking all possible parent paths
		const hasChildrenSet = new Set<string>();

		// For each atomic path, add all its parent paths to hasChildren set
		for (const atomicPath of this.atomicPathsCache.allPaths) {
			const parts = atomicPath.split('.');
			// Generate all parent paths (but not the leaf itself)
			for (let i = 1; i < parts.length; i++) {
				const parentPath = parts.slice(0, i).join('.');
				hasChildrenSet.add(parentPath);
			}
		}

		this.atomicPathsCache.hasChildrenSet = hasChildrenSet;
		this.atomicPathsCache.lastDefaultsRef = this.state.defaults;
		this.atomicPathsCache.lastUserRef = this.state.user;
	}

	private _computeCustomPaths(): Set<string> {
		const customPaths = new Set<string>();

		// Get all atomic paths in user settings (consistent with _updateAtomicPathsCache)
		const userPaths = getAllPaths(this.state.user);

		// Check which paths don't exist in defaults
		for (const path of userPaths) {
			const defaultValue = this._getValueByPath(this.state.defaults, path);
			if (defaultValue === undefined) {
				customPaths.add(path);
			}
		}

		return customPaths;
	}

	private _computeChangedPaths(): Set<string> {
		const changedPaths = new Set<string>();

		// Early exit if no user settings
		if (Object.keys(this.state.user).length === 0) {
			return changedPaths;
		}

		// Get all atomic paths in user settings (consistent with _updateAtomicPathsCache)
		const userPaths = getAllPaths(this.state.user);

		// Check each user path against defaults
		for (const path of userPaths) {
			const userValue = this._getValueByPath(this.state.user, path);
			const defaultValue = this._getValueByPath(this.state.defaults, path);

			if (!this._deepEqual(userValue, defaultValue)) {
				changedPaths.add(path);
			}
		}

		return changedPaths;
	}

	private _getValueByPath(obj: SettingsObject, path: string): unknown {
		return path
			.split('.')
			.reduce((current: unknown, key) => (current as Record<string, unknown>)?.[key], obj);
	}

	private _collectChangedPaths(
		currentPath: string,
		effective: unknown,
		defaults: unknown,
		changedPaths: Set<string>
	): void {
		// Use deep equality check instead of reference equality
		if (this._deepEqual(effective, defaults)) return;

		if (
			typeof effective === 'object' &&
			effective !== null &&
			typeof defaults === 'object' &&
			defaults !== null &&
			!Array.isArray(effective) &&
			!Array.isArray(defaults)
		) {
			const effObj = effective as Record<string, unknown>;
			const defObj = defaults as Record<string, unknown>;

			// Check all keys from both objects
			const allKeys = new Set([...Object.keys(effObj), ...Object.keys(defObj)]);

			for (const key of allKeys) {
				const childPath = currentPath ? `${currentPath}.${key}` : key;
				this._collectChangedPaths(childPath, effObj[key], defObj[key], changedPaths);
			}
		} else {
			// Primitive value, array, or object difference
			changedPaths.add(currentPath);
		}
	}

	private _deepEqual(a: unknown, b: unknown): boolean {
		// Fast path: reference equality
		if (a === b) return true;

		// Fast path: null/undefined
		if (a == null || b == null) return false;

		// Fast path: different types
		if (typeof a !== typeof b) return false;

		// Handle arrays
		if (Array.isArray(a)) {
			if (!Array.isArray(b) || a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!this._deepEqual(a[i], b[i])) return false;
			}
			return true;
		}

		// Handle objects
		if (typeof a === 'object') {
			const keysA = Object.keys(a as Record<string, unknown>);
			const keysB = Object.keys(b as Record<string, unknown>);

			// Fast path: different key counts
			if (keysA.length !== keysB.length) return false;

			// Check each key (avoid includes() for better performance)
			const objB = b as Record<string, unknown>;
			for (const key of keysA) {
				if (!(key in objB) || !this._deepEqual((a as Record<string, unknown>)[key], objB[key])) {
					return false;
				}
			}
			return true;
		}

		// Primitives (already checked equality above)
		return false;
	}
}

// Export singleton instance
export const settingsStore = new SettingsStore();
