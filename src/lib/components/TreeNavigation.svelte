<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { uiStore } from '$lib/stores/ui.svelte.js';
	import { highlightText } from '$lib/utils/highlight.js';

	interface Props {
		groups: Record<string, string[]>;
		activeSection?: string;
		onSectionClick?: (sectionId: string) => void;
		onHighlight?: (elementId: string | null) => void;
		onAboutClick?: () => void;
		isAboutActive?: boolean;
	}

	let {
		groups,
		activeSection = '',
		onSectionClick,
		onHighlight,
		onAboutClick,
		isAboutActive = false
	}: Props = $props();

	// Track which group is expanded (accordion behavior - only one at a time)
	let expandedGroup = $state<string | null>(null);

	// Track which section is currently active (scrollspy)
	let currentActiveSection = $state(activeSection);
	let currentActiveField = $state<string | null>(null);
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

	// Track highlight timeout for cleanup
	let highlightTimeout: ReturnType<typeof setTimeout> | undefined;

	// Sidebar scroll handling for "Go to top" button
	let sidebarEl: HTMLDivElement | null = null;
	let showGoTop = $state(false);

	function updateGoTopVisibility() {
		if (sidebarEl) {
			showGoTop = sidebarEl.scrollTop > 16;
		}
	}

	function scrollSidebarToTop() {
		if (sidebarEl) {
			sidebarEl.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	onMount(() => {
		// Expand the first group by default
		const firstGroup = Object.keys(groups)[0];
		if (firstGroup) {
			expandedGroup = firstGroup;
		}

		// Use scroll position-based scrollspy
		let scrollContainer: Element | null;

		function handleScroll() {
			if (!scrollContainer) return;

			const containerRect = scrollContainer.getBoundingClientRect();
			let activeGroup = '';
			let activeField: string | null = null;
			let minGroupDistance = Infinity;
			let minFieldDistance = Infinity;

			// Find the group that's closest to the top of the viewport
			Object.keys(groups).forEach((groupName) => {
				const element = document.getElementById(`group-${groupName}`);
				if (element) {
					const elementRect = element.getBoundingClientRect();
					// Distance from top of container (accounting for navbar)
					const distanceFromTop = elementRect.top - containerRect.top;

					// Consider elements that are visible in the viewport
					// Element is "active" if it's within reasonable viewing range
					if (distanceFromTop <= 200 && distanceFromTop > -elementRect.height + 100) {
						const absDistance = Math.abs(distanceFromTop);
						if (absDistance < minGroupDistance) {
							minGroupDistance = absDistance;
							activeGroup = groupName;
						}
					}
				}
			});

			// Find the most active field across all groups
			Object.entries(groups).forEach(([groupName, paths]) => {
				paths.forEach((path) => {
					const element = document.getElementById(`field-${path}`);
					if (element) {
						const elementRect = element.getBoundingClientRect();
						const distanceFromTop = elementRect.top - containerRect.top;

						// Field is "active" if it's close to the top of the viewport
						if (distanceFromTop <= 150 && distanceFromTop > -elementRect.height + 50) {
							const absDistance = Math.abs(distanceFromTop);
							if (absDistance < minFieldDistance) {
								minFieldDistance = absDistance;
								activeField = path;
							}
						}
					}
				});
			});

			// Update active section and field if different
			if (activeGroup !== currentActiveSection) {
				currentActiveSection = activeGroup;
			}
			if (activeField !== currentActiveField) {
				currentActiveField = activeField;

				// Auto-expand group if a field becomes active
				if (activeField) {
					const fieldGroup = Object.keys(groups).find((groupName) =>
						groups[groupName].includes(activeField as string)
					);
					if (fieldGroup && expandedGroup !== fieldGroup) {
						expandedGroup = fieldGroup;
					}
				}
			}
		}

		setTimeout(() => {
			// Find the main content container - be more specific
			const mainContent = document.querySelector('div.flex.flex-1.flex-col');
			if (mainContent) {
				scrollContainer = mainContent.querySelector('.flex-1.overflow-y-auto');
			}

			if (scrollContainer) {
				// Initial call to set active section
				handleScroll();

				// Add scroll listener with throttling
				let ticking = false;
				const throttledScroll = () => {
					if (!ticking) {
						requestAnimationFrame(() => {
							handleScroll();
							ticking = false;
						});
						ticking = true;
					}
				};

				scrollContainer.addEventListener('scroll', throttledScroll, { passive: true });

				// Cleanup function
				return () => {
					if (scrollContainer) {
						scrollContainer.removeEventListener('scroll', throttledScroll);
					}
				};
			}
		}, 500);

		return () => {
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
			if (highlightTimeout) {
				clearTimeout(highlightTimeout);
			}
		};
	});

	function toggleGroup(groupName: string) {
		// Accordion behavior: if it's already expanded, collapse it; otherwise expand only this one
		if (expandedGroup === groupName) {
			expandedGroup = null; // Collapse current group
		} else {
			expandedGroup = groupName; // Expand this group (automatically collapses others)
		}
	}

	function addHighlight(elementId: string) {
		// Clear any existing highlight timeout
		if (highlightTimeout) {
			clearTimeout(highlightTimeout);
		}

		// Trigger highlight via callback
		onHighlight?.(elementId);

		// Clear the highlight after 1.5 seconds
		highlightTimeout = setTimeout(() => {
			onHighlight?.(null);
		}, 1500);
	}

	function scrollToGroup(groupName: string, shouldExpand: boolean = true) {
		// Expand this group when scrolling to it (accordion behavior)
		if (shouldExpand) {
			expandedGroup = groupName;
		}

		// Small delay to ensure any layout changes complete before scrolling
		setTimeout(() => {
			const element = document.getElementById(`group-${groupName}`);
			// Find the main content container more specifically
			const mainContent = document.querySelector('div.flex.flex-1.flex-col');
			const contentContainer = mainContent?.querySelector('.flex-1.overflow-y-auto') as HTMLElement;

			if (element && contentContainer) {
				// Get element position relative to the scroll container
				const containerRect = contentContainer.getBoundingClientRect();
				const elementRect = element.getBoundingClientRect();
				const scrollTop = contentContainer.scrollTop;

				// Calculate target scroll position with offset for navbar
				const targetScrollTop = scrollTop + (elementRect.top - containerRect.top) - 60;

				// Smooth scroll only the content container
				contentContainer.scrollTo({
					top: targetScrollTop,
					behavior: 'smooth'
				});

				// Add highlight after scroll
				setTimeout(() => {
					addHighlight(`group-${groupName}`);
				}, 300);
			}
		}, 50);

		onSectionClick?.(groupName);
	}

	function scrollToField(path: string) {
		// Small delay to ensure any layout changes complete before scrolling
		setTimeout(() => {
			const element = document.getElementById(`field-${path}`);
			// Find the main content container more specifically
			const mainContent = document.querySelector('div.flex.flex-1.flex-col');
			const contentContainer = mainContent?.querySelector('.flex-1.overflow-y-auto') as HTMLElement;

			if (element && contentContainer) {
				// Get element position relative to the scroll container
				const containerRect = contentContainer.getBoundingClientRect();
				const elementRect = element.getBoundingClientRect();
				const scrollTop = contentContainer.scrollTop;

				// Calculate target scroll position with offset for navbar
				const targetScrollTop = scrollTop + (elementRect.top - containerRect.top) - 60;

				// Smooth scroll only the content container
				contentContainer.scrollTo({
					top: targetScrollTop,
					behavior: 'smooth'
				});

				// Add highlight after scroll
				setTimeout(() => {
					addHighlight(`field-${path}`);
				}, 300);
			}
		}, 50);
	}

	function formatGroupName(groupName: string): string {
		return groupName.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	function formatFieldName(path: string): string {
		const parts = path.split('.');
		const fieldName = parts[parts.length - 1];
		return fieldName.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Search highlight helpers
	function highlightedGroupLabel(groupName: string): string {
		const label = formatGroupName(groupName);
		const q = (uiStore as any).searchQuery;
		return q && q.length >= 2 ? highlightText(label, q) : label;
	}

	function highlightedFieldLabel(path: string): string {
		const label = formatFieldName(path);
		const q = (uiStore as any).searchQuery;
		return q && q.length >= 2 ? highlightText(label, q) : label;
	}

	// Count deeply nested children for a level 2 path
	function getDeepChildrenCount(path: string, allPaths: string[]): number {
		const parts = path.split('.');
		if (parts.length !== 2) return 0; // Only for level 2 paths

		return allPaths.filter((p) => p.startsWith(path + '.') && p.split('.').length > 2).length;
	}

	// Group a group's paths by their second-level segment
	function groupBySecondSegment(
		paths: string[]
	): Array<{ key: string; label: string; children: string[] }> {
		const map = new Map<string, string[]>();
		for (const p of paths) {
			const parts = p.split('.');
			const key = parts.length > 1 ? parts[1] : '(root)';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(p);
		}
		return Array.from(map.entries()).map(([key, children]) => ({
			key,
			label:
				key === '(root)'
					? 'Root'
					: key.replace(/[_-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
			children
		}));
	}
</script>

<nav
	class="shadow-soft relative flex h-full w-72 flex-col border-r bg-background/60 backdrop-blur-md"
>
	<!-- Go to Top floating button -->
	<Button
		variant="secondary"
		size="sm"
		onclick={scrollSidebarToTop}
		class="shadow-medium absolute top-2 right-2 z-10 transition-opacity duration-300 bg-background/60 backdrop-blur-md border-2 border-border/30 {showGoTop
			? 'opacity-100 text-primary'
			: 'pointer-events-none opacity-0 text-primary'}"
	>
		<span class="mr-1 text-xs text-primary">Scroll To Top</span>
		<ChevronUp class="h-4 w-4 text-primary" />
	</Button>
	<!-- Content (Scrollable) -->
	<div class="flex-1 overflow-y-auto" bind:this={sidebarEl} onscroll={updateGoTopVisibility}>
		<div class="space-y-4 p-4">
			<!-- About Section -->
			<div>
				<Button
					variant={isAboutActive ? 'secondary' : 'ghost'}
					onclick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						onAboutClick?.();
					}}
					class="w-full justify-start text-left"
				>
					About
				</Button>
			</div>

			<!-- Divider -->
			<div class="border-t"></div>

			<!-- Table of Contents -->
			<div>
				<h2 class="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
					Table of Contents
				</h2>

				<div class="space-y-1">
					{#each Object.entries(groups) as [groupName, paths]}
						{@const isExpanded = expandedGroup === groupName}
						{@const isActive = currentActiveSection === groupName}
						{@const isStandaloneProperty = paths.length === 1 && paths[0] === groupName}
						{@const allPaths = Object.values(groups).flat()}

						<div class="space-y-1">
							{#if isStandaloneProperty}
								<!-- Standalone Property (no grouping needed) -->
								{@const isActiveStandaloneField = currentActiveField === groupName}
								<Button
									variant="ghost"
									size="sm"
									onclick={(event) => {
										event.preventDefault();
										event.stopPropagation();
										// Switch to editor view and scroll to field
										onSectionClick?.(groupName);
										scrollToField(groupName);
									}}
									class="h-8 w-full justify-start px-2 {isActiveStandaloneField
										? 'border-l-2 border-primary bg-primary/10 font-semibold text-primary'
										: isActive
											? 'border-l-2 border-primary bg-primary/10 font-medium text-primary'
											: ''}"
								>
									<span class="truncate">{formatFieldName(groupName)}</span>
								</Button>
							{:else}
								<!-- Real Group with Children -->
								<div class="flex items-center">
									<Button
										variant="ghost"
										size="sm"
										onclick={(event) => {
											event.preventDefault();
											event.stopPropagation();
											const wasExpanded = expandedGroup === groupName;
											toggleGroup(groupName);
											// Switch to editor view and scroll if expanding
											if (!wasExpanded) {
												onSectionClick?.(groupName);
												scrollToGroup(groupName, false); // Don't let scrollToGroup override the toggle
											}
										}}
										class="h-8 w-full justify-start px-2 {isActive
											? 'border-l-2 border-primary bg-primary/10 font-medium text-primary'
											: ''}"
									>
										<ChevronRight
											class="mr-2 h-3 w-3 transition-transform duration-200 {isExpanded
												? 'rotate-90'
												: ''}"
										/>
										<span class="truncate">{@html highlightedGroupLabel(groupName)}</span>
										<span class="ml-auto text-xs text-muted-foreground">
											{paths.length}
										</span>
									</Button>
								</div>

								<!-- Group Fields with subsection headings for deep keys -->
								{#if isExpanded}
									<div
										class="ml-6 overflow-hidden border-l border-border/30 pl-3"
										transition:slide={{ duration: 200, axis: 'y' }}
									>
										{#each groupBySecondSegment(paths) as subsection}
											{#if subsection.children.length === 1 && subsection.key !== '(root)'}
												{@const path = subsection.children[0]}
												{@const deepChildrenCount = getDeepChildrenCount(path, allPaths)}
												{@const isActiveField = currentActiveField === path}
												<Button
													variant="ghost"
													size="sm"
													onclick={(event) => {
														event.preventDefault();
														event.stopPropagation();
														onSectionClick?.(path);
														scrollToField(path);
													}}
													class="h-7 w-full justify-start px-2 text-xs {isActiveField
														? 'bg-primary/5 font-semibold text-foreground'
														: 'text-muted-foreground'} hover:bg-accent/50 hover:text-foreground"
												>
													<span class="truncate">{@html highlightedFieldLabel(path)}</span>
													{#if deepChildrenCount > 0}
														<span
															class="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
															>{deepChildrenCount}</span
														>
													{/if}
												</Button>
											{:else}
												<div class="mt-2 first:mt-0">
													{#if subsection.key !== '(root)'}
														<div
															class="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase"
														>
															{subsection.label}
														</div>
													{/if}
													<div class="space-y-0.5">
														{#each subsection.children as path}
															{@const deepChildrenCount = getDeepChildrenCount(path, allPaths)}
															{@const isActiveField = currentActiveField === path}
															<Button
																variant="ghost"
																size="sm"
																onclick={(event) => {
																	event.preventDefault();
																	event.stopPropagation();
																	// Switch to editor view and scroll to field
																	onSectionClick?.(path);
																	scrollToField(path);
																}}
																class="h-7 w-full justify-start px-2 text-xs {isActiveField
																	? 'bg-primary/5 font-semibold text-foreground'
																	: 'text-muted-foreground'} hover:bg-accent/50 hover:text-foreground"
															>
																<span class="truncate">{@html highlightedFieldLabel(path)}</span>
																{#if deepChildrenCount > 0}
																	<span
																		class="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
																		>{deepChildrenCount}</span
																	>
																{/if}
															</Button>
														{/each}
													</div>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Footer (Fixed) -->
	<!-- <div class="border-t p-4">
		<p class="text-center text-xs text-muted-foreground">
			Created by <span class="font-medium text-foreground">Paul Park</span>
		</p>
	</div> -->
</nav>
