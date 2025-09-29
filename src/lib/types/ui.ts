/**
 * UI metadata and component types
 */

import type { JsonPointer } from './settings.js';

// Widget type for field rendering
export type WidgetType = 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'json' | 'list';

// Group inclusion rules
export interface GroupInclude {
	/** Exact JSON pointers to include */
	pointers?: JsonPointer[];
	/** Path prefixes to include (e.g., "/terminal/" includes all terminal settings) */
	prefix?: string[];
}

// Group definition for organizing settings
export interface SettingsGroup {
	id: string;
	title: string;
	include: GroupInclude;
	order?: JsonPointer[];
}

// Widget override for a specific field
export interface WidgetOverride {
	widget?: WidgetType;
	label?: string;
	labels?: Record<string, string>; // For select options
	placeholder?: string;
	helpUrl?: string;
	suffix?: string;
	hidden?: boolean;
	readonly?: boolean;
	min?: number;
	max?: number;
	step?: number;
}

// Complete UI metadata structure
export interface UiMeta {
	groups: SettingsGroup[];
	overrides?: Record<JsonPointer, WidgetOverride>;
	order?: {
		groups?: string[];
		withinGroup?: 'default-traversal' | JsonPointer[];
	};
}

// UI state for the application
export interface UiState {
	searchQuery: string;
	activeGroupId: string | null;
	showChangedOnly: boolean;
	isLoading: boolean;
	errors: string[];
}
