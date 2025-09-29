<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Search, X, ChevronRight, Settings } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/ui.svelte.js';
	import { getAllPaths, groupPathsBySection } from '$lib/stores/store-utils.js';

	interface Props {
		defaults: Record<string, unknown>;
		changedPaths: Set<string>;
		showChangedOnly: boolean;
	}

	let { defaults, changedPaths, showChangedOnly }: Props = $props();

	// Get all available paths and group them
	let allPaths = $derived(() => getAllPaths(defaults));
	let pathGroups = $derived(() => groupPathsBySection(allPaths()));
	let groupNames = $derived(() => Object.keys(pathGroups()).sort());

	// Filter paths based on search and changed-only filter
	let filteredGroups = $derived(() => {
		const query = uiStore.searchQuery;
		let pathsToShow = allPaths();

		// Apply changed-only filter first
		if (showChangedOnly) {
			pathsToShow = pathsToShow.filter((path) => changedPaths.has(path));
		}

		// Apply search filter (only if query is 3+ characters)
		if (query && query.length >= 3) {
			const matchingPaths = uiStore.searchFields(pathsToShow, {}, query);
			pathsToShow = pathsToShow.filter((path) => matchingPaths.has(path));
		}

		// Group the filtered paths
		const filtered = groupPathsBySection(pathsToShow);

		// Only return groups that have paths
		return Object.fromEntries(Object.entries(filtered).filter(([_, paths]) => paths.length > 0));
	});

	let filteredGroupNames = $derived(() => Object.keys(filteredGroups()).sort());

	function handleGroupClick(groupName: string) {
		if (uiStore.activeGroup === groupName) {
			uiStore.setActiveGroup(null);
		} else {
			uiStore.setActiveGroup(groupName);
		}
	}

	function clearSearch() {
		uiStore.clearSearch();
	}

	function formatGroupName(name: string): string {
		return name.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	function getChangedCount(groupName: string): number {
		const groupPaths = pathGroups()[groupName] || [];
		return groupPaths.filter((path) => changedPaths.has(path)).length;
	}
</script>

<aside class="flex h-full w-80 flex-col border-r bg-muted/30">
	<!-- Search -->
	<div class="border-b p-4">
		<div class="relative">
			<Search
				class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
			/>
			<Input
				bind:value={uiStore.searchQuery}
				placeholder="Search settings..."
				class="pr-10 pl-10"
			/>
			{#if uiStore.searchQuery}
				<Button
					variant="ghost"
					size="sm"
					onclick={clearSearch}
					class="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0"
				>
					<X class="h-3 w-3" />
				</Button>
			{/if}
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex-1 overflow-y-auto">
		{#if filteredGroupNames().length === 0}
			<div class="p-4 text-center text-muted-foreground">
				{#if uiStore.searchQuery}
					No settings match your search
				{:else if showChangedOnly}
					No changed settings
				{:else}
					No settings available
				{/if}
			</div>
		{:else}
			<nav class="p-2">
				{#each filteredGroupNames() as groupName}
					{@const isActive = uiStore.activeGroup === groupName}
					{@const changedCount = getChangedCount(groupName)}
					{@const groupPaths = filteredGroups()[groupName] || []}

					<div class="mb-1">
						<Button
							variant="ghost"
							class="h-auto w-full justify-between p-3 {isActive ? 'bg-accent' : ''}"
							onclick={() => handleGroupClick(groupName)}
						>
							<div class="flex items-center space-x-2">
								<Settings class="h-4 w-4" />
								<span class="font-medium">{formatGroupName(groupName)}</span>
							</div>

							<div class="flex items-center space-x-2">
								{#if changedCount > 0}
									<Badge variant="secondary" class="text-xs">
										{changedCount}
									</Badge>
								{/if}
								<ChevronRight class="h-4 w-4 transition-transform {isActive ? 'rotate-90' : ''}" />
							</div>
						</Button>

						{#if isActive && groupPaths.length > 0}
							<div class="mt-1 ml-6 space-y-1">
								{#each groupPaths as path}
									{@const isChanged = changedPaths.has(path)}
									{@const fieldName = path.split('.').pop() || ''}

									<div class="flex items-center justify-between px-2 py-1 text-sm">
										<span class="truncate text-muted-foreground">
											{fieldName.replace(/[_-]/g, ' ')}
										</span>
										{#if isChanged}
											<Badge variant="outline" class="text-xs">modified</Badge>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</nav>
		{/if}
	</div>

	<!-- Footer info -->
	<div class="border-t p-4 text-sm text-muted-foreground">
		<div class="flex justify-between">
			<span>Total: {allPaths().length}</span>
			{#if changedPaths.size > 0}
				<span>Changed: {changedPaths.size}</span>
			{/if}
		</div>
	</div>
</aside>
