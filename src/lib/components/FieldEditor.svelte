<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { RotateCcw, Info } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/ui.svelte.js';
	import { settingsStore } from '$lib/stores/settings.svelte.js';
	import { highlightText } from '$lib/utils/highlight.js';
	import { parseSimpleMarkdown } from '$lib/utils/markdown.js';

	interface Props {
		path: string;
		value: unknown;
		defaultValue: unknown;
		changed: boolean;
		custom?: boolean;
		description?: string;
		validation?: any[];
		hideLabel?: boolean;
		onUpdate: (value: unknown) => void;
		onReset: () => void;
	}

	let {
		path,
		value,
		defaultValue,
		changed,
		custom = false,
		description,
		validation,
		hideLabel = false,
		onUpdate,
		onReset
	}: Props = $props();

	// Convert path to label
	let label = $derived(() => {
		return path
			.split('.')
			.map((part) => part.replace(/[_-]/g, ' '))
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' › ');
	});

	// Highlight helpers (label, description, value)
	let highlightedLabel = $derived(() => {
		const q = uiStore.searchQuery;
		const base = uiStore.showRawKeys ? path : label();
		return q && q.length >= 2 ? highlightText(base, q) : base;
	});

	let highlightedDescriptionHTML = $derived(() => {
		if (!description) return '';
		const q = uiStore.searchQuery;
		const html = parseSimpleMarkdown(description);
		return q && q.length >= 2 ? highlightText(html, q) : html;
	});

	let highlightedValueHTML = $derived(() => {
		const q = uiStore.searchQuery;
		const text = String(stringValue ?? '');
		return q && q.length >= 2 ? highlightText(text, q) : '';
	});

	let hasValueMatch = $derived(() => {
		const q = uiStore.searchQuery;
		if (!q || q.length < 2) return false;
		return String(stringValue ?? '')
			.toLowerCase()
			.includes(q.toLowerCase());
	});

	// Indicator: whether the current value is an object/array
	let isStructuredValue = $derived(() => {
		return (typeof value === 'object' && value !== null) || Array.isArray(value);
	});

	// Determine field type and render appropriate input
	let fieldType = $derived(() => {
		if (typeof value === 'boolean') return 'boolean';
		if (typeof value === 'number') return 'number';
		if (typeof value === 'string') return 'string';
		if (Array.isArray(value)) return 'array';
		if (typeof value === 'object' && value !== null) return 'object';
		return 'string'; // fallback
	});

	// Convert value to string for editing
	let stringValue = $state('');

	// Update string value when value prop changes
	$effect(() => {
		if (fieldType() === 'object' || fieldType() === 'array') {
			stringValue = JSON.stringify(value, null, 2);
		} else {
			stringValue = String(value ?? '');
		}
	});

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		const newStringValue = target.value;
		stringValue = newStringValue;

		try {
			let newValue: unknown;

			switch (fieldType()) {
				case 'boolean':
					newValue = newStringValue.toLowerCase() === 'true';
					break;

				case 'number':
					newValue = newStringValue === '' ? null : Number(newStringValue);
					if (isNaN(newValue as number)) return; // Don't update if invalid number
					break;

				case 'object':
				case 'array':
					if (newStringValue.trim() === '') {
						newValue = fieldType() === 'array' ? [] : {};
					} else {
						newValue = JSON.parse(newStringValue);
					}
					break;

				default: {
					// string (but allow object/array detection)
					const trimmed = newStringValue.trim();
					// Detect JSON-like object/array input and parse it
					if (
						(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
						(trimmed.startsWith('[') && trimmed.endsWith(']'))
					) {
						try {
							const parsed = JSON.parse(trimmed);
							// Only accept object/array results; otherwise keep as string
							if (typeof parsed === 'object' && parsed !== null) {
								newValue = parsed;
								break;
							}
						} catch (_) {
							// Fall through to saving as string
						}
					}
					newValue = newStringValue;
					break;
				}
			}

			onUpdate(newValue);
		} catch (error) {
			// For JSON parsing errors, don't update the value
			console.debug('Invalid JSON input:', error);
		}
	}

	function handleCheckboxChange(checked: boolean) {
		onUpdate(checked);
	}


	// Helper to check if this field has children (optimized with cached data)
	let hasChildren = $derived(() => {
		// Use pre-computed hasChildren set for O(1) lookup
		return settingsStore.hasChildrenSet.has(path);
	});


</script>

<div class="space-y-3 py-4  {changed ? 'bg-orange-100/80 dark:bg-orange-950/50' : ''}">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div class="space-y-1">
			{#if !hideLabel}
				<div class="flex items-center gap-2">
					<Label class="text-sm font-medium">
						{@html highlightedLabel()}
					</Label>
					{#if changed}
						<Badge variant="outline" class="text-xs">Modified</Badge>
					{/if}
					{#if custom}
						<Badge variant="secondary" class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
							<span class="text-orange-500 mr-1">*</span>Custom
						</Badge>
					{/if}
					{#if isStructuredValue()}
						<span class="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
							>object</span
						>
					{/if}
				</div>
			{:else if changed || custom}
				<div class="flex items-center gap-2 " >
					{#if changed}
						<Badge variant="outline" class="text-xs">Modified</Badge>
					{/if}
					{#if custom}
						<Badge variant="secondary" class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
							<span class="text-orange-500 mr-1">*</span>Custom
						</Badge>
					{/if}
				</div>
			{/if}

			{#if description}
				<div class="flex items-start gap-2 text-sm text-muted-foreground">
					<!-- <Info class="mt-0.5 h-4 w-4 flex-shrink-0" /> -->
					<div class="markdown-content whitespace-pre-line">
						{@html highlightedDescriptionHTML()}
					</div>
				</div>
			{/if}
		</div>

		{#if changed}
			<Button variant="ghost" size="sm" onclick={onReset} title="Reset to default">
				<RotateCcw class="h-4 w-4" />
			</Button>
		{/if}
	</div>

	<!-- Input Field -->
	<div class="space-y-2">
		{#if fieldType() === 'boolean'}
			<div class="flex items-center space-x-3">
				<Switch checked={Boolean(value)} onCheckedChange={handleCheckboxChange} />
				<span class="font-mono text-sm">{value ? 'true' : 'false'}</span>
			</div>
		{:else if fieldType() === 'object' || fieldType() === 'array'}
			<!-- Simple JSON Input -->
			<Textarea
				value={stringValue}
				oninput={handleInputChange}
				class="min-h-[120px] max-w-lg font-mono text-sm"
				placeholder={fieldType() === 'array' ? '[]' : '{}'}
			/>
		{:else}
			<!-- Simple Input for other types -->
			<Input
				type={fieldType() === 'number' ? 'number' : 'text'}
				value={stringValue}
				oninput={handleInputChange}
				class="max-w-md {fieldType() === 'number' ? '' : 'font-mono'}"
			/>
		{/if}

		<div class="flex items-center justify-between">
			{#if hasValueMatch()}
				<div class="text-xs text-muted-foreground">
					<span>Matches: </span>
					<span class="font-mono">{@html highlightedValueHTML()}</span>
				</div>
			{/if}
			{#if isStructuredValue()}
				<div class="text-[10px] text-muted-foreground">Stored as object</div>
			{/if}
		</div>

		<!-- Default Value Display (only when changed and no children) -->
		{#if changed && !hasChildren()}
			<div class="text-xs text-muted-foreground">
				<span class="font-medium">Default:</span>
				{#if typeof defaultValue === 'object' && defaultValue !== null}
					<!-- Multi-line display for objects -->
					<pre class="mt-1 p-2 bg-muted/50 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32 max-w-lg">
{JSON.stringify(defaultValue, null, 2)}
					</pre>
				{:else}
					<!-- Inline display for primitives -->
					<code class="ml-1 rounded bg-muted px-1">
						{defaultValue === undefined ? 'undefined' : String(defaultValue)}
					</code>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Validation Errors -->
	{#if validation && validation.length > 0}
		<div class="space-y-1">
			{#each validation as error}
				<div class="flex items-center gap-1 text-xs text-red-600">
					<span class="h-1 w-1 rounded-full bg-red-600"></span>
					{error.message}
				</div>
			{/each}
		</div>
	{/if}
</div>
