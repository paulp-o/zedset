import type { SettingsObject, ValidationResult, JsonSchema } from '$lib/types/index.js';
import { merge } from '$lib/core/merge.js';
import { diff } from '$lib/core/diff.js';
import { validateSettings } from '$lib/core/validator.js';
import { fetchDefaultSettings, parseJsoncWithDocs } from '$lib/parsers/jsonc-parser.js';

interface SettingsState {
	defaults: SettingsObject;
	user: SettingsObject;
	schema: JsonSchema | null;
	docsMap: Record<string, string>;
	loading: boolean;
	error: string | null;
}

interface DerivedState {
	effective: SettingsObject;
	delta: SettingsObject;
	validation: ValidationResult;
	changedPaths: Set<string>;
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

		return { effective, delta, validation, changedPaths };
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
		// Deep clone only when necessary for nested paths
		const updated = JSON.parse(JSON.stringify(this.state.user));
		this._setByPath(updated, path, value);
		this.state.user = updated;
	}

	resetUserSetting(path: string): void {
		// Remove the path from user settings
		const updated = JSON.parse(JSON.stringify(this.state.user));
		this._deleteByPath(updated, path);
		this.state.user = updated;
	}

	resetAllUserSettings(): void {
		this.state.user = {};
	}

	resetSection(sectionPath: string): void {
		// Remove all user settings under the section path
		const updated = JSON.parse(JSON.stringify(this.state.user));
		this._deleteByPath(updated, sectionPath);
		this.state.user = updated;
	}

	// Helper methods
	private _computeChangedPaths(): Set<string> {
		const changedPaths = new Set<string>();

		// Get all paths in user settings
		const userPaths = this._getAllPathsInObject(this.state.user);

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

	private _getAllPathsInObject(obj: SettingsObject, prefix = ''): Set<string> {
		const paths = new Set<string>();

		for (const [key, value] of Object.entries(obj)) {
			const currentPath = prefix ? `${prefix}.${key}` : key;
			paths.add(currentPath);

			if (value && typeof value === 'object' && !Array.isArray(value)) {
				const nestedPaths = this._getAllPathsInObject(value as SettingsObject, currentPath);
				nestedPaths.forEach((path) => paths.add(path));
			}
		}

		return paths;
	}

	private _getValueByPath(obj: SettingsObject, path: string): unknown {
		return path.split('.').reduce((current, key) => current?.[key], obj);
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

	private _setByPath(obj: SettingsObject, path: string, value: unknown): void {
		const parts = path.split('.');
		let current = obj;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];

			// Only create new object if it doesn't exist or is not a valid object
			// NEVER replace existing objects or arrays - this preserves sibling data
			if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
				current[part] = {};
			}
			// If it's an array, we can't navigate into it with object keys, so this is an error case
			else if (Array.isArray(current[part])) {
				console.error(`Cannot set object path '${path}' - '${part}' is an array, not an object`);
				return;
			}
			current = current[part] as SettingsObject;
		}

		current[parts[parts.length - 1]] = value;
	}

	private _deleteByPath(obj: SettingsObject, path: string): void {
		const parts = path.split('.');
		let current = obj;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
				return; // Path doesn't exist
			}
			current = current[part] as SettingsObject;
		}

		delete current[parts[parts.length - 1]];

		// Clean up empty parent objects
		this._cleanupEmptyObjects(obj, parts.slice(0, -1));
	}

	private _cleanupEmptyObjects(obj: SettingsObject, pathParts: string[]): void {
		if (pathParts.length === 0) return;

		let current = obj;
		for (let i = 0; i < pathParts.length - 1; i++) {
			current = current[pathParts[i]] as SettingsObject;
		}

		const lastKey = pathParts[pathParts.length - 1];
		const target = current[lastKey];

		if (typeof target === 'object' && target !== null && Object.keys(target).length === 0) {
			delete current[lastKey];
			this._cleanupEmptyObjects(obj, pathParts.slice(0, -1));
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
				if (!(key in objB) || !this._deepEqual((a as any)[key], objB[key])) {
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
