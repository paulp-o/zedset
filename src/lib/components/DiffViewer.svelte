<script lang="ts">
	import { ChevronDown, ChevronRight, Plus, Minus, Edit3, File } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { settingsDetailedDiff } from '$lib/core/diff.js';
	import type { SettingsObject } from '$lib/types/index.js';

	interface Props {
		effective: SettingsObject; // Actually user settings in this context
		defaults: SettingsObject;
	}

	let { effective: userSettings, defaults }: Props = $props();

	// Track expanded sections
	let expandedSections = $state<Set<string>>(new Set());

	// Compute detailed diff for additive settings
	let diffResult = $derived(() => settingsDetailedDiff(userSettings, defaults));

	// Group changes by top-level section
	let groupedChanges = $derived(() => {
		const groups: Record<string, { added: string[]; modified: string[]; removed: string[] }> = {};

		const allChanges = [...diffResult().added, ...diffResult().modified, ...diffResult().removed];

		for (const path of allChanges) {
			const topLevel = path.split('.')[0];
			if (!groups[topLevel]) {
				groups[topLevel] = { added: [], modified: [], removed: [] };
			}

			if (diffResult().added.includes(path)) {
				groups[topLevel].added.push(path);
			} else if (diffResult().modified.includes(path)) {
				groups[topLevel].modified.push(path);
			} else if (diffResult().removed.includes(path)) {
				groups[topLevel].removed.push(path);
			}
		}

		return groups;
	});

	function toggleSection(section: string) {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		expandedSections = newExpanded;
	}

	function getValueByPath(obj: SettingsObject, path: string): unknown {
		return path.split('.').reduce((current: any, key) => current?.[key], obj);
	}

	function formatValue(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'string') return `"${value}"`;
		if (typeof value === 'object') return JSON.stringify(value, null, 2);
		return String(value);
	}

	function getChangeIcon(type: 'added' | 'modified' | 'removed') {
		switch (type) {
			case 'added':
				return Plus;
			case 'modified':
				return Edit3;
			case 'removed':
				return Minus;
		}
	}

	function getChangeColorClass(type: 'added' | 'modified' | 'removed') {
		switch (type) {
			case 'added':
				return 'text-emerald-700 dark:text-emerald-300';
			case 'modified':
				return 'text-blue-700 dark:text-blue-300';
			case 'removed':
				return 'text-red-700 dark:text-red-300';
		}
	}

	function getChangeBackgroundClass(type: 'added' | 'modified' | 'removed') {
		switch (type) {
			case 'added':
				return 'bg-emerald-50 border-l-emerald-500 dark:bg-emerald-950/30 dark:border-l-emerald-400';
			case 'modified':
				return 'bg-blue-50 border-l-blue-500 dark:bg-blue-950/30 dark:border-l-blue-400';
			case 'removed':
				return 'bg-red-50 border-l-red-500 dark:bg-red-950/30 dark:border-l-red-400';
		}
	}

	function getBadgeVariant(type: 'added' | 'modified' | 'removed') {
		switch (type) {
			case 'added':
				return 'default';
			case 'modified':
				return 'secondary';
			case 'removed':
				return 'destructive';
		}
	}
</script>

{#if Object.keys(groupedChanges()).length === 0}
	<div class="rounded-lg border border-dashed py-12 text-center">
		<File class="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
		<p class="text-sm font-medium text-muted-foreground">No changes detected</p>
		<p class="text-xs text-muted-foreground/80">Your settings match the defaults</p>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold tracking-tight">Configuration Changes</h3>
				<p class="text-sm text-muted-foreground">Review your modifications from default settings</p>
			</div>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						expandedSections = new Set(Object.keys(groupedChanges()));
					}}
					class="text-xs"
				>
					Expand All
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						expandedSections = new Set();
					}}
					class="text-xs"
				>
					Collapse All
				</Button>
			</div>
		</div>

		<div class="space-y-4">
			{#each Object.entries(groupedChanges()) as [section, changes]}
				{@const isExpanded = expandedSections.has(section)}
				{@const totalChanges =
					changes.added.length + changes.modified.length + changes.removed.length}

				<Card class="border-0 shadow-sm ring-1 ring-border/50">
					<CardHeader class="pb-4">
						<div class="flex items-center justify-between">
							<Button
								variant="ghost"
								class="flex h-auto items-center gap-3 p-0 hover:bg-transparent"
								onclick={() => toggleSection(section)}
							>
								{#if isExpanded}
									<ChevronDown class="h-4 w-4 text-muted-foreground" />
								{:else}
									<ChevronRight class="h-4 w-4 text-muted-foreground" />
								{/if}
								<div class="text-left">
									<CardTitle class="text-base font-medium tracking-tight">
										{section.replace(/[_-]/g, ' ')}
									</CardTitle>
									<p class="text-xs text-muted-foreground font-mono">{section}</p>
								</div>
							</Button>
							<div class="flex items-center gap-2">
								{#if changes.added.length > 0}
									<Badge variant="outline" class="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
										+{changes.added.length}
									</Badge>
								{/if}
								{#if changes.modified.length > 0}
									<Badge variant="outline" class="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
										~{changes.modified.length}
									</Badge>
								{/if}
								{#if changes.removed.length > 0}
									<Badge variant="outline" class="text-xs px-2 py-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
										-{changes.removed.length}
									</Badge>
								{/if}
								<Badge variant="outline" class="text-xs px-2 py-0.5">
									{totalChanges}
								</Badge>
							</div>
						</div>
					</CardHeader>

					{#if isExpanded}
						<CardContent class="pt-0">
							<div class="space-y-4">
								{#each changes.added as path}
									{@const Icon = getChangeIcon('added')}
									<div class="rounded-lg border-l-4 {getChangeBackgroundClass('added')} p-4">
										<div class="mb-3 flex items-center justify-between">
											<div class="flex items-center gap-3">
												<div class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
													<Icon class="h-3 w-3 {getChangeColorClass('added')}" />
												</div>
												<div>
													<p class="font-mono text-sm font-medium">{path}</p>
													<p class="text-xs text-muted-foreground">Added setting</p>
												</div>
											</div>
											<Badge variant="outline" class="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
												New
											</Badge>
										</div>
										<div class="rounded-md bg-background/50 p-3 font-mono text-xs">
											<div class="text-muted-foreground mb-1">Value:</div>
											<div class="text-foreground">{formatValue(getValueByPath(userSettings, path))}</div>
										</div>
									</div>
								{/each}

								{#each changes.modified as path}
									{@const Icon = getChangeIcon('modified')}
									<div class="rounded-lg border-l-4 {getChangeBackgroundClass('modified')} p-4">
										<div class="mb-3 flex items-center justify-between">
											<div class="flex items-center gap-3">
												<div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
													<Icon class="h-3 w-3 {getChangeColorClass('modified')}" />
												</div>
												<div>
													<p class="font-mono text-sm font-medium">{path}</p>
													<p class="text-xs text-muted-foreground">Modified setting</p>
												</div>
											</div>
											<Badge variant="outline" class="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
												Changed
											</Badge>
										</div>
										<div class="grid grid-cols-2 gap-4">
											<div class="rounded-md bg-background/30 p-3">
												<div class="text-xs text-muted-foreground mb-2 font-medium">Default</div>
												<div class="font-mono text-xs text-foreground/80">
													{formatValue(getValueByPath(defaults, path))}
												</div>
											</div>
											<div class="rounded-md bg-background/50 p-3">
												<div class="text-xs text-muted-foreground mb-2 font-medium">Current</div>
												<div class="font-mono text-xs text-foreground">
													{formatValue(getValueByPath(userSettings, path))}
												</div>
											</div>
										</div>
									</div>
								{/each}

								{#each changes.removed as path}
									{@const Icon = getChangeIcon('removed')}
									<div class="rounded-lg border-l-4 {getChangeBackgroundClass('removed')} p-4">
										<div class="mb-3 flex items-center justify-between">
											<div class="flex items-center gap-3">
												<div class="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
													<Icon class="h-3 w-3 {getChangeColorClass('removed')}" />
												</div>
												<div>
													<p class="font-mono text-sm font-medium">{path}</p>
													<p class="text-xs text-muted-foreground">Removed setting</p>
												</div>
											</div>
											<Badge variant="outline" class="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800">
												Removed
											</Badge>
										</div>
										<div class="rounded-md bg-background/30 p-3 font-mono text-xs">
											<div class="text-muted-foreground mb-1">Previous value:</div>
											<div class="text-foreground/80">{formatValue(getValueByPath(defaults, path))}</div>
										</div>
									</div>
								{/each}
							</div>
						</CardContent>
					{/if}
				</Card>
			{/each}
		</div>
	</div>
{/if}
