<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { settingsStore } from '$lib/stores/settings.svelte.js';
	import { uiStore } from '$lib/stores/ui.svelte.js';
	import FieldEditor from '$lib/components/FieldEditor.svelte';
	import TreeNavigation from '$lib/components/TreeNavigation.svelte';
	import AboutView from '$lib/components/AboutView.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Loader2, AlertCircle, Search, X, Link, CheckCircle } from 'lucide-svelte';
	import { getAllPaths, getValueByPath } from '$lib/stores/store-utils.js';
	import { encodeConfig, decodeConfig } from '$lib/core/url-sharing.js';
	import { parseSimpleMarkdown } from '$lib/utils/markdown.js';
	import { Dialog, DialogFooter } from '$lib/components/ui/dialog';
	import DialogContent from '$lib/components/ui/dialog/dialog-content.svelte';
	import DialogHeader from '$lib/components/ui/dialog/dialog-header.svelte';
	import DialogDescription from '$lib/components/ui/dialog/dialog-description.svelte';
	import DialogTitle from '$lib/components/ui/dialog/dialog-title.svelte';

	// URL state management
	let isLoadingFromUrl = $state(false);
	let hasSharedConfig = $state(false);
	let urlCopied = $state(false);

	// Dialog state
	let showResetAllConfirmation = $state(false);
	let showFieldResetConfirmation = $state(false);
	let fieldToReset = $state<string>('');

	// Load settings from URL query parameters on page load
	function loadFromUrl() {
		try {
			const urlParams = new URLSearchParams(window.location.search);
			const configParam = urlParams.get('config');

			if (configParam) {
				isLoadingFromUrl = true;
				hasSharedConfig = true;
				const userSettings = decodeConfig(configParam);
				settingsStore.loadUserSettings(userSettings);
				isLoadingFromUrl = false;
				return true;
			} else {
				hasSharedConfig = false;
			}
		} catch (error) {
			console.error('Failed to load settings from URL:', error);
			isLoadingFromUrl = false;
			hasSharedConfig = false;
		}
		return false;
	}

	// Update URL with current user settings
	function updateUrl() {
		if (isLoadingFromUrl) return; // Don't update URL when loading from URL

		try {
			const userSettings = settingsStore.user;
			if (Object.keys(userSettings).length === 0) {
				// Remove config from URL if no user settings
				const urlParams = new URLSearchParams(window.location.search);
				if (urlParams.has('config')) {
					urlParams.delete('config');
					const newUrl = `${window.location.origin}${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
					window.history.replaceState({}, '', newUrl);
					hasSharedConfig = false;
				}
			} else {
				// Update URL with encoded settings
				const encoded = encodeConfig(userSettings);
				const urlParams = new URLSearchParams(window.location.search);
				urlParams.set('config', encoded);
				const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
				window.history.replaceState({}, '', newUrl);
				hasSharedConfig = true;
			}
		} catch (error) {
			console.error('Failed to update URL with settings:', error);
			hasSharedConfig = false;
		}
	}

	// Watch for user settings changes and update URL
	$effect(() => {
		const userSettings = settingsStore.user;
		// Trigger URL update when settings change (with debounce)
		const timeoutId = setTimeout(() => {
			updateUrl();
		}, 100);
		return () => clearTimeout(timeoutId);
	});

	// Handle browser navigation (back/forward)
	function handlePopstate() {
		loadFromUrl();
	}

	// Copy current URL to clipboard
	async function copyCurrentUrl() {
		try {
			const currentUrl = window.location.href;
			await navigator.clipboard.writeText(currentUrl);
			urlCopied = true;
			setTimeout(() => {
				urlCopied = false;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy URL:', error);
		}
	}

	// Load defaults on mount
	onMount(() => {
		// Load defaults asynchronously
		settingsStore
			.loadDefaults()
			.then(() => {
				// After defaults are loaded, try to load from URL
				loadFromUrl();
			})
			.catch((error) => {
				console.error('Error loading defaults:', error);
			});

		// Add keyboard event listener for search shortcut
		document.addEventListener('keydown', handleKeydown);

		// Add popstate listener for browser navigation
		window.addEventListener('popstate', handlePopstate);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('popstate', handlePopstate);
		};
	});

	// Filter paths to only include atomic ones (no children)
	function getAtomicPathsOnly(paths: string[]): string[] {
		return paths.filter((path) => {
			// Only include paths that don't have children
			return !settingsStore.hasChildrenSet.has(path);
		});
	}

	// Debounced search query for performance
	let debouncedSearchQuery = $state('');
	let searchDebounceTimer: number | NodeJS.Timeout = 0;

	// Watch for search query changes and debounce them
	$effect(() => {
		const query = uiStore.searchQuery;
		clearTimeout(searchDebounceTimer);

		if (query.length < 3) {
			debouncedSearchQuery = query;
		} else {
			searchDebounceTimer = setTimeout(() => {
				debouncedSearchQuery = query;
			}, 150); // 150ms debounce
		}
	});

	// Use cached atomic paths from settings store for performance
	let allPathsCache = $derived(() => {
		return settingsStore.allAtomicPaths;
	});

	// Get visible paths based on active group and filters - optimized version
	let visiblePaths = $derived(() => {
		try {
			const allPaths = allPathsCache();

			// Early exit if no paths
			if (allPaths.length === 0) return [];

			// If showing changed only, start with changed paths as the base (much smaller set)
			let filtered: string[];
			if (uiStore.showChangedOnly) {
				// Convert Set to Array once and filter from there - much more efficient
				filtered = Array.from(settingsStore.changedPaths);

				// Only show atomic paths (no children) - respects the atomic-only rule
				filtered = getAtomicPathsOnly(filtered);

				// Apply group filter to the smaller changed paths set
				if (uiStore.activeGroup) {
					const groupPrefix = uiStore.activeGroup + '.';
					filtered = filtered.filter((path) => path.startsWith(groupPrefix));
				}
			} else {
				// Standard filtering when not showing changed only
				filtered = allPaths;

				// Filter by active group
				if (uiStore.activeGroup) {
					const groupPrefix = uiStore.activeGroup + '.';
					filtered = filtered.filter((path) => path.startsWith(groupPrefix));
				}
			}

			// Filter by search (only if query is 3+ characters) - use debounced query
			if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
				const searchResults = uiStore.searchFields(
					filtered,
					settingsStore.docsMap,
					debouncedSearchQuery
				);
				filtered = filtered.filter((path) => searchResults.has(path));
			}

			return filtered.sort();
		} catch (error) {
			console.error('Error in visiblePaths derivation:', error);
			return [];
		}
	});

	// Calculate changed paths that would be visible - independent of showChangedOnly filter
	let visibleChangedCount = $derived(() => {
		try {
			const allPaths = allPathsCache();
			const changedPathsSet = settingsStore.changedPaths;

			// Start with all paths, then apply filters (except showChangedOnly)
			let filtered = allPaths;

			// Filter by active group
			if (uiStore.activeGroup) {
				const groupPrefix = uiStore.activeGroup + '.';
				filtered = filtered.filter((path) => path.startsWith(groupPrefix));
			}

			// Filter by search (only if query is 3+ characters) - use debounced query
			if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
				const searchResults = uiStore.searchFields(
					filtered,
					settingsStore.docsMap,
					debouncedSearchQuery
				);
				filtered = filtered.filter((path) => searchResults.has(path));
			}

			// Count how many of the filtered paths are actually changed
			return filtered.filter((path) => changedPathsSet.has(path)).length;
		} catch (error) {
			console.error('Error in visibleChangedCount derivation:', error);
			return 0;
		}
	});

	// Group paths with maximum 2 levels for sidebar navigation
	let groupedPaths = $derived(() => {
		const allPaths = visiblePaths();
		const groups: Record<string, string[]> = {};

		for (const path of allPaths) {
			const parts = path.split('.');

			if (parts.length === 1) {
				// Root level property - create its own group
				groups[path] = [path];
			} else {
				// Nested property - group by root level only
				const rootKey = parts[0];
				if (!groups[rootKey]) {
					groups[rootKey] = [];
				}
				groups[rootKey].push(path);
			}
		}

		// Sort groups by name and sort paths within each group
		const sortedGroups: Record<string, string[]> = {};
		for (const groupName of Object.keys(groups).sort()) {
			sortedGroups[groupName] = groups[groupName].sort();
		}

		return sortedGroups;
	});

	function handleFieldUpdate(path: string, value: unknown) {
		settingsStore.updateUserSetting(path, value);
	}

	function handleFieldReset(path: string) {
		fieldToReset = path;
		showFieldResetConfirmation = true;
	}

	function confirmFieldReset() {
		if (fieldToReset) {
			settingsStore.resetUserSetting(fieldToReset);
			showFieldResetConfirmation = false;
			fieldToReset = '';
		}
	}

	function handleResetAll() {
		showResetAllConfirmation = true;
	}

	function confirmResetAll() {
		settingsStore.resetAllUserSettings();
		showResetAllConfirmation = false;
	}

	function getFieldValue(path: string): unknown {
		return getValueByPath(settingsStore.effective, path);
	}

	function getFieldDefault(path: string): unknown {
		return getValueByPath(settingsStore.defaults, path);
	}

	function isFieldChanged(path: string): boolean {
		return settingsStore.changedPaths.has(path);
	}

	function isFieldCustom(path: string): boolean {
		return settingsStore.customPaths.has(path);
	}

	// Track highlighted elements for the pulse effect
	let highlightedElement = $state<string | null>(null);

	function handleHighlight(elementId: string | null) {
		highlightedElement = elementId;
	}

	// Get current view from query parameters, default to 'editor'
	let currentView = $derived(() => {
		const view = $page.url.searchParams.get('view');
		return view || 'editor';
	});

	// Navigation handlers
	function handleAboutClick() {
		// Preserve query parameters when navigating to about
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set('view', 'about');
		goto(`/?${urlParams.toString()}`);
	}

	function handleSettingsClick() {
		// Preserve query parameters when navigating to editor
		const urlParams = new URLSearchParams(window.location.search);
		urlParams.set('view', 'editor');
		goto(`/?${urlParams.toString()}`);
	}

	function handleSectionClick(sectionId: string) {
		// Always switch to editor view when clicking on any settings section
		handleSettingsClick();
	}

	// Determine if About is active based on query parameter
	let isAboutActive = $derived(currentView() === 'about');

	// Search functionality
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		uiStore.setSearchQuery(target.value);
	}

	function clearSearch() {
		uiStore.clearSearch();
	}

	// Keyboard shortcut for search (Ctrl/Cmd + K)
	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			const searchInput = document.getElementById('search-input') as HTMLInputElement;
			if (searchInput) {
				searchInput.focus();
			}
		}
	}

	// Get group-level documentation (comments that apply to the whole group)
	function getGroupDocumentation(groupName: string): string | null {
		// For single-item "groups" (standalone properties), don't show group docs
		const groupPaths = groupedPaths()[groupName] || [];
		if (groupPaths.length === 1 && groupPaths[0] === groupName) {
			return null; // This is a standalone property, not a real group
		}

		return settingsStore.docsMap[groupName] || null;
	}

	// Get field-level documentation
	function getFieldDocumentation(path: string): string | null {
		// Only show exact field-level comments, never fall back to group comments
		// This prevents duplication where group comments show up on individual fields
		return settingsStore.docsMap[path] || null;
	}

	// Generate Zed documentation URL for a group
	function getZedDocsUrl(groupName: string): string {
		// Convert group name to URL format (lowercase, spaces to dashes)
		const urlSlug = groupName
			.toLowerCase()
			.replace(/[_]/g, '-') // Convert underscores to dashes
			.replace(/\s+/g, '-') // Convert spaces to dashes
			.replace(/[^a-z0-9-]/g, ''); // Remove special characters

		return `https://zed.dev/docs/configuring-zed#${urlSlug}`;
	}
</script>

<div class="flex h-[calc(100vh-3.5rem)]">
	<!-- Tree Navigation (Hidden on About view) -->
	{#if currentView() !== 'about'}
		<TreeNavigation
			groups={groupedPaths()}
			customPaths={settingsStore.customPaths}
			onSectionClick={handleSectionClick}
			onHighlight={handleHighlight}
			onAboutClick={handleAboutClick}
			{isAboutActive}
		/>
	{/if}

	<!-- Main Content -->
	<div class="flex flex-1 flex-col">
		<!-- Toolbar -->
		<div class="bg-background/80">
			<!-- Primary Navigation Line -->
			<div class="flex items-center justify-between gap-4 px-4 pt-4 pb-3">
				<div class="flex items-center space-x-4">
					{#if currentView() === 'about'}
						<!-- Back to Editor Button -->
						<Button variant="outline" size="sm" onclick={handleSettingsClick} class="text-sm">
							← Back to Editor
						</Button>
						<!-- <h2 class="text-xl font-semibold tracking-tight">About ZedSet</h2> -->
					{:else}
						<!-- Editor View Title -->
						<h2 class="text-xl font-semibold tracking-tight">
							{#if uiStore.activeGroup}
								{uiStore.activeGroup.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
							{:else}
								All Settings
							{/if}
						</h2>
					{/if}
				</div>

				<!-- Search Input - Primary Action (Editor Only) -->
				{#if currentView() === 'editor'}
					<div class="relative">
						<Search
							class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="search-input"
							type="text"
							placeholder="Search settings... (Ctrl+K)"
							value={uiStore.searchQuery}
							oninput={handleSearchInput}
							class="w-80 pr-9 pl-9 {uiStore.searchQuery && uiStore.searchQuery.length <= 2
								? 'border-amber-300 focus:border-amber-300 focus:ring-amber-200'
								: ''}"
						/>
						{#if uiStore.searchQuery}
							<button
								type="button"
								onclick={clearSearch}
								class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							>
								<X class="h-4 w-4" />
							</button>
						{/if}

						<!-- Search requirement hint -->
						{#if uiStore.searchQuery && uiStore.searchQuery.length <= 2}
							<div class="absolute top-full left-0 mt-1 w-full">
								<div
									class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/50"
								>
									<div class="flex items-center space-x-2">
										<div class="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
										<span class="text-amber-700 dark:text-amber-300">
											Type at least 3 characters to search
										</span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Secondary Controls Line (Editor Only) -->
			{#if currentView() === 'editor'}
				<div
					class="flex items-center justify-between gap-4 border-b border-dashed bg-background/80 px-4 pb-3"
				>
					<!-- View Controls -->
					<div class="flex items-center space-x-6">
						<div class="flex items-center space-x-4">
							<div class="flex items-center space-x-2">
								<Checkbox
									id="changed-only"
									checked={uiStore.showChangedOnly}
									onCheckedChange={(checked) => uiStore.setShowChangedOnly(checked)}
								/>
								<Label for="changed-only" class="text-sm text-muted-foreground">
									Show Modified Only
									{#if visibleChangedCount() > 0}
										<span
											class="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
										>
											{visibleChangedCount()}
										</span>
									{/if}
								</Label>
							</div>

							<div class="flex items-center space-x-2">
								<Checkbox
									id="raw-keys"
									checked={uiStore.showRawKeys}
									onCheckedChange={(checked) => uiStore.setShowRawKeys(checked)}
								/>
								<Label for="raw-keys" class="text-sm text-muted-foreground">Show raw keys</Label>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex items-center space-x-2">
						<!-- {#if hasSharedConfig}
							<Button variant="ghost" size="sm" onclick={copyCurrentUrl}>
								{#if urlCopied}
									<CheckCircle class="mr-2 h-3.5 w-3.5" />
									Copied!
								{:else}
									<Link class="mr-2 h-3.5 w-3.5" />
									Copy URL
								{/if}
							</Button>
						{/if} -->

						{#if settingsStore.changedPaths.size > 0}
							<Button variant="outline" size="sm" onclick={handleResetAll}>
								Reset All Changes
							</Button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Search Results Summary (Editor Only) -->
			{#if currentView() === 'editor' && uiStore.searchQuery}
				<div class="border-t bg-muted/30 px-4 py-2">
					<div class="flex items-center justify-between">
						{#if uiStore.searchQuery.length <= 2}
							<p class="text-sm text-amber-600 dark:text-amber-400">
								<span class="font-medium"
									>Type {3 - uiStore.searchQuery.length} more character{3 -
										uiStore.searchQuery.length !==
									1
										? 's'
										: ''}</span
								> to start searching...
							</p>
						{:else}
							<p class="text-sm text-muted-foreground">
								<span class="font-medium">{visiblePaths().length}</span> result{visiblePaths()
									.length !== 1
									? 's'
									: ''} for
								<span class="font-medium">"{uiStore.searchQuery}"</span>
							</p>
						{/if}
						<button
							type="button"
							onclick={clearSearch}
							class="text-sm text-muted-foreground hover:text-foreground"
						>
							Clear search
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Content Area -->
		{#if currentView() === 'about'}
			<AboutView />
		{:else}
			<div class="flex-1 overflow-y-auto p-6">
				{#if settingsStore.loading}
					<div class="flex h-32 items-center justify-center">
						<Loader2 class="mr-2 h-6 w-6 animate-spin" />
						<span>Fetching latest default settings data...</span>
					</div>
				{:else if settingsStore.error}
					<Alert variant="destructive">
						<AlertCircle class="h-4 w-4" />
						<AlertDescription>
							{settingsStore.error}
						</AlertDescription>
					</Alert>
				{:else if visiblePaths().length === 0}
					<div class="py-12 text-center text-muted-foreground">
						{#if uiStore.searchQuery}
							No settings match your search query
						{:else if uiStore.showChangedOnly}
							No changed settings to display
						{:else if uiStore.activeGroup}
							No settings in this group
						{:else}
							No settings available
						{/if}
					</div>
				{:else}
					<div class="space-y-6">
						{#each Object.entries(groupedPaths()) as [groupName, paths] (groupName)}
							{@const isStandaloneProperty = paths.length === 1 && paths[0] === groupName}
							<Card
								id="group-{groupName}"
								class="transition-smooth shadow-soft hover:shadow-medium card-gradient relative overflow-hidden backdrop-blur-sm"
							>
								<div
									class="pointer-events-none absolute inset-0 bg-primary/10 transition-opacity duration-700 ease-out {highlightedElement ===
									`group-${groupName}`
										? 'opacity-100'
										: 'opacity-0'}"
								></div>
								<CardHeader class="pt-4">
									<div class="flex items-center justify-between">
										<CardTitle class="text-lg capitalize">
											{groupName.replace(/[_-]/g, ' ')}
										</CardTitle>
										<a
											href={getZedDocsUrl(groupName)}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-primary"
											title={`Read official ${groupName.replace(/[_-]/g, ' ')} documentation`}
										>
											Read official docs
										</a>
									</div>
									{#if getGroupDocumentation(groupName)}
										<div
											class="markdown-content mt-0 border-l-4 border-blue-200 pl-3 text-sm text-muted-foreground"
										>
											{@html parseSimpleMarkdown(getGroupDocumentation(groupName) || '')}
										</div>
									{/if}
								</CardHeader>
								<CardContent class="space-y-0 pt-0">
									{#each paths as path, index (path)}
										<div
											id="field-{path}"
											class="rounded-xl p-1 transition-all duration-700 ease-out {highlightedElement ===
											`field-${path}`
												? ' rounded-2xl bg-primary/0 ring-3 ring-ring/50'
												: 'ring-transparent'}"
										>
											<FieldEditor
												{path}
												value={getFieldValue(path)}
												defaultValue={getFieldDefault(path)}
												changed={isFieldChanged(path)}
												custom={isFieldCustom(path)}
												description={getFieldDocumentation(path) || undefined}
												validation={settingsStore.validation.fieldErrors[path]}
												onUpdate={(value) => handleFieldUpdate(path, value)}
												onReset={() => handleFieldReset(path)}
												hideLabel={isStandaloneProperty}
											/>
										</div>
										{#if index < paths.length - 1}
											<hr class="border-border/50" />
										{/if}
									{/each}
								</CardContent>
							</Card>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
<div>
	<!-- Reset Confirmation Dialogs -->
	<Dialog
		open={showResetAllConfirmation}
		onOpenChange={(open) => (showResetAllConfirmation = open)}
	>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Reset All Changes</DialogTitle>
				<DialogDescription>
					This will reset all your custom settings back to the default Zed configuration. This
					action cannot be undone.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button variant="outline" onclick={() => (showResetAllConfirmation = false)}>Cancel</Button>
				<Button variant="destructive" onclick={confirmResetAll}>Reset All</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<Dialog
		open={showFieldResetConfirmation}
		onOpenChange={(open) => (showFieldResetConfirmation = open)}
	>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Reset Field</DialogTitle>
				<DialogDescription>
					This will reset this field back to its default value. This action cannot be undone.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button
					variant="outline"
					onclick={() => {
						showFieldResetConfirmation = false;
						fieldToReset = '';
					}}
				>
					Cancel
				</Button>
				<Button variant="destructive" onclick={confirmFieldReset}>Reset Field</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</div>

<style>
	/* Markdown styles for group documentation */
	:global(.markdown-content .inline-code) {
		background-color: hsl(var(--muted));
		color: hsl(var(--primary));
		padding: 0.125rem 0.375rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--border));
		font-family:
			ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		font-size: 0.875em;
		font-weight: 600;
		letter-spacing: -0.01em;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	:global(.markdown-content .inline-bold) {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	:global(.markdown-content .inline-italic) {
		font-style: italic;
		color: hsl(var(--muted-foreground));
	}
</style>
