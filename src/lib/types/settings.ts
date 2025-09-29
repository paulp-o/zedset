/**
 * Core settings data structures for the Zed Settings Editor
 */

// JSON Pointer string (e.g., "/theme", "/buffer_font_size")
export type JsonPointer = string;

// Raw settings object (can contain any valid JSON values)
export type SettingsObject = Record<string, unknown>;

// Documentation map from JSON pointers to human-readable descriptions
export type DocsMap = Record<JsonPointer, string>;

// Settings data at different stages of processing
export interface SettingsData {
	/** Default values from default.settings.jsonc */
	defaults: SettingsObject;
	/** User-provided settings (imported or edited) */
	user: SettingsObject;
	/** Merged result of defaults + user overrides */
	effective: SettingsObject;
	/** Only the differences from defaults (for export) */
	delta: SettingsObject;
	/** Set of paths where effective differs from defaults */
	changedPaths: Set<JsonPointer>;
}

// Parsed JSONC result
export interface JsoncParseResult {
	/** Parsed JSON value */
	value: SettingsObject;
	/** Map of JSON pointers to documentation strings */
	docs: DocsMap;
	/** Any parsing errors */
	errors: string[];
}
