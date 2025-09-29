<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SettingsGroup, JsonPointer, SettingsObject, JsonSchema, UiMeta } from '$lib/types';
	import { getChangedPaths } from '$lib/core';
	import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '$lib/ui';
	import FieldEditor from './FieldEditor.svelte';
	// Props
	interface Props {
		group: SettingsGroup;
		effectiveSettings?: SettingsObject;
		defaultSettings?: SettingsObject;
		schema?: JsonSchema;
		uiMeta?: UiMeta;
		docsMap?: Record<JsonPointer, string>;
		showChangedOnly?: boolean;
	}

	let {
		group,
		effectiveSettings = {},
		defaultSettings = {},
		schema = undefined,
		uiMeta = undefined,
		docsMap = {},
		showChangedOnly = false
	}: Props = $props();

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		fieldChange: { path: JsonPointer; value: unknown };
		fieldReset: { path: JsonPointer };
		groupReset: { groupId: string };
	}>();

	// Get fields for this group
	let groupFields = $derived(() => {
		const fields: JsonPointer[] = [];

		// Add exact pointers
		if (group.include.pointers) {
			fields.push(...group.include.pointers);
		}

		// Add fields matching prefixes
		if (group.include.prefix) {
			for (const prefix of group.include.prefix) {
				// Find all keys in effective settings that start with this prefix
				const matchingKeys = Object.keys(effectiveSettings).filter((key) =>
					`/${key}`.startsWith(prefix)
				);
				fields.push(...matchingKeys.map((key) => `/${key}` as JsonPointer));
			}
		}

		// Remove duplicates and sort
		return [...new Set(fields)].sort();
	});

	// Get changed paths for this group
	let changedPaths = $derived(() => {
		return getChangedPaths(effectiveSettings, defaultSettings);
	});

	// Filter fields based on showChangedOnly
	let visibleFields = $derived(() => {
		if (!showChangedOnly) return groupFields();
		return groupFields().filter((path) => changedPaths().has(path));
	});

	// Count of changed fields in this group
	let changedCount = $derived(() => {
		return groupFields().filter((path) => changedPaths().has(path)).length;
	});

	// Check if group has any changes
	let hasChanges = $derived(changedCount() > 0);

	// Get value for a field path
	function getFieldValue(path: JsonPointer): unknown {
		// Remove leading slash and split path
		const parts = path.split('/').filter(Boolean);
		let current: any = effectiveSettings;

		for (const part of parts) {
			if (current && typeof current === 'object') {
				current = current[part];
			} else {
				return undefined;
			}
		}

		return current;
	}

	// Get default value for a field path
	function getDefaultValue(path: JsonPointer): unknown {
		const parts = path.split('/').filter(Boolean);
		let current: any = defaultSettings;

		for (const part of parts) {
			if (current && typeof current === 'object') {
				current = current[part];
			} else {
				return undefined;
			}
		}

		return current;
	}

	// Handle field changes
	function handleFieldChange(event: CustomEvent<{ path: JsonPointer; value: unknown }>) {
		dispatch('fieldChange', event.detail);
	}

	// Handle field reset
	function handleFieldReset(event: CustomEvent<{ path: JsonPointer }>) {
		dispatch('fieldReset', event.detail);
	}

	// Handle group reset
	function handleGroupReset() {
		dispatch('groupReset', { groupId: group.id });
	}
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between space-y-0 py-3 pt-6">
		<div class="flex items-center space-x-2">
			<CardTitle class="text-lg font-semibold">
				{group.title}
			</CardTitle>
			{#if hasChanges}
				<Badge variant="secondary" class="text-xs">
					{changedCount} changed
				</Badge>
			{/if}
		</div>

		{#if hasChanges}
			<Button
				variant="ghost"
				size="sm"
				onclick={handleGroupReset}
				class="text-muted-foreground hover:text-foreground"
			>
				Reset Group
			</Button>
		{/if}
	</CardHeader>

	<CardContent class="space-y-6">
		{#if visibleFields().length === 0}
			{#if showChangedOnly}
				<p class="py-4 text-center text-sm text-muted-foreground">
					No changed settings in this group.
				</p>
			{:else}
				<p class="py-4 text-center text-sm text-muted-foreground">
					No settings found for this group.
				</p>
			{/if}
		{:else}
			{#each visibleFields() as path (path)}
				<div class="border-b border-border pb-4 last:border-b-0 last:pb-0">
					<FieldEditor
						path={String(path)}
						value={getFieldValue(String(path))}
						defaultValue={getDefaultValue(String(path))}
						changed={changedPaths().has(String(path))}
						description={docsMap[String(path)] || ''}
						onUpdate={(value) => dispatch('fieldChange', { path: String(path), value })}
						onReset={() => dispatch('fieldReset', { path: String(path) })}
					/>
				</div>
			{/each}
		{/if}
	</CardContent>
</Card>
