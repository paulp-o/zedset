<script lang="ts">
	import { Sun, Moon, Monitor } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';

	function getLabelForTheme(theme: string) {
		switch (theme) {
			case 'light':
				return 'Switch to dark mode';
			case 'dark':
				return 'Switch to system mode';
			default:
				return 'Switch to light mode';
		}
	}

	const currentTheme = $derived(themeStore.theme);
	const currentLabel = $derived(getLabelForTheme(currentTheme));
</script>

<Button
	variant="ghost"
	size="sm"
	class="h-8 w-8 px-0"
	onclick={() => themeStore.toggleTheme()}
	title={currentLabel}
>
	{#if currentTheme === 'light'}
		<Sun class="h-4 w-4" />
	{:else if currentTheme === 'dark'}
		<Moon class="h-4 w-4" />
	{:else}
		<Monitor class="h-4 w-4" />
	{/if}
	<span class="sr-only">{currentLabel}</span>
</Button>
