import type { ComponentType } from 'svelte';
import type { WidgetType, JsonPointer, JsonSchema, UiMeta, WidgetHints } from '$lib/types';
import { extractWidgetHints, getFieldWidgetHints } from '$lib/core';

// Import shadcn-svelte components
import Button from '$lib/components/ui/button/button.svelte';
import Input from '$lib/components/ui/input/input.svelte';
import Label from '$lib/components/ui/label/label.svelte';
import Switch from '$lib/components/ui/switch/switch.svelte';
import Textarea from '$lib/components/ui/textarea/textarea.svelte';
import Select, {
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '$lib/components/ui/select';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
import Badge from '$lib/components/ui/badge/badge.svelte';

// Widget configuration interface
export interface WidgetConfig {
	component: ComponentType;
	props?: Record<string, unknown>;
	requiresOptions?: boolean; // For select widgets
	supportedTypes?: string[]; // JSON Schema types this widget supports
}

/**
 * Registry of available widgets mapped by widget type
 */
export const WIDGET_REGISTRY: Record<WidgetType, WidgetConfig> = {
	text: {
		component: Input,
		props: { type: 'text' },
		supportedTypes: ['string']
	},
	textarea: {
		component: Textarea,
		props: { rows: 4 },
		supportedTypes: ['string']
	},
	number: {
		component: Input,
		props: { type: 'number' },
		supportedTypes: ['number', 'integer']
	},
	switch: {
		component: Switch,
		supportedTypes: ['boolean']
	},
	select: {
		component: Select,
		requiresOptions: true,
		supportedTypes: ['string', 'number', 'boolean']
	},
	json: {
		component: Textarea,
		props: {
			rows: 6,
			placeholder: 'Enter valid JSON...',
			class: 'font-mono text-sm'
		},
		supportedTypes: ['object', 'array']
	},
	list: {
		component: Textarea,
		props: {
			rows: 3,
			placeholder: 'Enter comma-separated values...'
		},
		supportedTypes: ['array']
	}
};

/**
 * Widget selection options for customizing behavior
 */
export interface WidgetSelectionOptions {
	/** Force a specific widget type regardless of hints */
	forceWidget?: WidgetType;
	/** Prefer certain widgets over others */
	widgetPreferences?: Partial<Record<string, WidgetType>>;
	/** Custom widget overrides from UI meta */
	uiOverrides?: Record<JsonPointer, any>;
}

/**
 * Selects the appropriate widget for a field based on schema, UI meta, and options
 * @param path - JSON pointer to the field
 * @param schema - The JSON schema for validation
 * @param uiMeta - UI metadata with overrides
 * @param options - Additional selection options
 * @returns The selected widget configuration
 */
export function selectWidget(
	path: JsonPointer,
	schema?: JsonSchema,
	uiMeta?: UiMeta,
	options: WidgetSelectionOptions = {}
): { widget: WidgetType; config: WidgetConfig; hints: WidgetHints } {
	// 1. Check for forced widget
	if (options.forceWidget) {
		return {
			widget: options.forceWidget,
			config: WIDGET_REGISTRY[options.forceWidget],
			hints: { widget: options.forceWidget }
		};
	}

	// 2. Check UI meta overrides
	const uiOverride = uiMeta?.overrides?.[path];
	if (uiOverride?.widget) {
		const widget = uiOverride.widget as WidgetType;
		return {
			widget,
			config: WIDGET_REGISTRY[widget],
			hints: { widget, ...uiOverride }
		};
	}

	// 3. Extract hints from schema
	const schemaHints = schema ? getFieldWidgetHints(schema, path) : {};

	// 4. Apply preferences
	const preferredWidget = options.widgetPreferences?.[schemaHints.type || ''];
	if (preferredWidget && WIDGET_REGISTRY[preferredWidget]) {
		return {
			widget: preferredWidget,
			config: WIDGET_REGISTRY[preferredWidget],
			hints: { ...schemaHints, widget: preferredWidget }
		};
	}

	// 5. Use schema-suggested widget or fallback
	const widget = (schemaHints.widget as WidgetType) || 'text';

	return {
		widget,
		config: WIDGET_REGISTRY[widget],
		hints: schemaHints
	};
}

/**
 * Gets the display label for a field
 * @param path - JSON pointer to the field
 * @param uiMeta - UI metadata with label overrides
 * @returns Human-readable label
 */
export function getFieldLabel(path: JsonPointer, uiMeta?: UiMeta): string {
	// Check UI meta override
	const override = uiMeta?.overrides?.[path];
	if (override?.label) {
		return override.label;
	}

	// Extract from path (remove leading slash and convert to title case)
	const parts = path.split('/').filter(Boolean);
	const lastPart = parts[parts.length - 1] || 'Setting';

	// Convert snake_case or camelCase to Title Case
	return lastPart
		.replace(/[_-]/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Gets the placeholder text for a field
 * @param path - JSON pointer to the field
 * @param hints - Widget hints from schema
 * @param uiMeta - UI metadata with placeholder overrides
 * @returns Placeholder text
 */
export function getFieldPlaceholder(
	path: JsonPointer,
	hints: WidgetHints,
	uiMeta?: UiMeta
): string {
	// Check UI meta override
	const override = uiMeta?.overrides?.[path];
	if (override?.placeholder) {
		return override.placeholder;
	}

	// Use schema hint
	if (hints.placeholder) {
		return hints.placeholder;
	}

	// Generate default based on widget type
	switch (hints.widget) {
		case 'text':
			return `Enter ${getFieldLabel(path, uiMeta).toLowerCase()}...`;
		case 'number':
			const range =
				hints.minimum !== undefined && hints.maximum !== undefined
					? ` (${hints.minimum}-${hints.maximum})`
					: '';
			return `Enter number${range}...`;
		case 'textarea':
			return 'Enter text...';
		case 'json':
			return 'Enter valid JSON...';
		case 'list':
			return 'Enter comma-separated values...';
		default:
			return '';
	}
}

/**
 * Validates if a widget type is suitable for a given JSON Schema type
 * @param widget - The widget type to check
 * @param schemaType - The JSON Schema type
 * @returns True if compatible
 */
export function isWidgetCompatible(widget: WidgetType, schemaType?: string): boolean {
	if (!schemaType) return true;

	const config = WIDGET_REGISTRY[widget];
	return config.supportedTypes?.includes(schemaType) ?? true;
}

/**
 * Gets all available widget types for a given schema type
 * @param schemaType - The JSON Schema type
 * @returns Array of compatible widget types
 */
export function getCompatibleWidgets(schemaType?: string): WidgetType[] {
	if (!schemaType) return Object.keys(WIDGET_REGISTRY) as WidgetType[];

	return (Object.keys(WIDGET_REGISTRY) as WidgetType[]).filter((widget) =>
		isWidgetCompatible(widget, schemaType)
	);
}

// Re-export shadcn components for convenience
export {
	Button,
	Input,
	Label,
	Switch,
	Textarea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Badge
};
