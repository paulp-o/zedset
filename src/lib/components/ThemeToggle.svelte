<script lang="ts">
	import { Sun, Moon, Monitor } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';

	function getThemeIcon(theme: string) {
		switch (theme) {
			case 'light':
				return Sun;
			case 'dark':
				return Moon;
			default:
				return Monitor;
		}
	}

	function getThemeLabel(theme: string) {
		switch (theme) {
			case 'light':
				return 'Switch to dark mode';
			case 'dark':
				return 'Switch to system mode';
			default:
				return 'Switch to light mode';
		}
	}

	const CurrentIcon = $derived(getThemeIcon(themeStore.theme));
	const currentLabel = $derived(getThemeLabel(themeStore.theme));
</script>

<Button
	variant="ghost"
	size="sm"
	class="h-8 w-8 px-0"
	onclick={() => themeStore.toggleTheme()}
	title={currentLabel}
>
	<CurrentIcon class="h-4 w-4" />
	<span class="sr-only">{currentLabel}</span>
</Button>
