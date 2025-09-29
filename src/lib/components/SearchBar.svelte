<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button, Badge } from '$lib/ui';
	import { cn } from '$lib/utils';

	// Props
	export let searchQuery = '';
	export let showChangedOnly = false;
	export let changedCount = 0;
	export let totalCount = 0;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		searchChange: { query: string };
		toggleChangedOnly: { showChangedOnly: boolean };
		clearSearch: void;
	}>();

	// Handle search input
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		dispatch('searchChange', { query: target.value });
	}

	// Handle toggle changed only
	function handleToggleChangedOnly() {
		const newValue = !showChangedOnly;
		dispatch('toggleChangedOnly', { showChangedOnly: newValue });
	}

	// Clear search
	function handleClearSearch() {
		dispatch('clearSearch');
		dispatch('searchChange', { query: '' });
	}

	// Results summary
	let resultsSummary = $derived(() => {
		if (searchQuery && showChangedOnly) {
			return `${changedCount} changed results`;
		} else if (searchQuery) {
			return `${totalCount} results`;
		} else if (showChangedOnly) {
			return `${changedCount} changed settings`;
		}
		return '';
	});
</script>

<div class="flex flex-col space-y-3 border-b border-border bg-background p-4">
	<!-- Main Search Bar -->
	<div class="relative flex items-center space-x-2">
		<!-- Search Input -->
		<div class="relative flex-1">
			<svg
				class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				></path>
			</svg>

			<input
				type="text"
				placeholder="Search settings..."
				value={searchQuery}
				oninput={handleSearchInput}
				class="w-full rounded-md border border-input bg-background py-2 pr-10 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
			/>

			{#if searchQuery}
				<button
					type="button"
					onclick={handleClearSearch}
					class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			{/if}
		</div>

		<!-- Changed Only Toggle -->
		<Button
			variant={showChangedOnly ? 'default' : 'outline'}
			size="sm"
			onclick={handleToggleChangedOnly}
			class={cn(
				'flex items-center space-x-2 whitespace-nowrap',
				showChangedOnly && 'bg-primary text-primary-foreground'
			)}
		>
			<span>Changed Only</span>
			{#if changedCount > 0}
				<Badge variant={showChangedOnly ? 'secondary' : 'default'} class="text-xs">
					{changedCount}
				</Badge>
			{/if}
		</Button>
	</div>

	<!-- Results Summary -->
	{#if resultsSummary}
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">{resultsSummary}</p>

			{#if searchQuery || showChangedOnly}
				<button
					type="button"
					onclick={() => {
						dispatch('searchChange', { query: '' });
						dispatch('toggleChangedOnly', { showChangedOnly: false });
					}}
					class="text-sm text-muted-foreground hover:text-foreground"
				>
					Clear filters
				</button>
			{/if}
		</div>
	{/if}
</div>
