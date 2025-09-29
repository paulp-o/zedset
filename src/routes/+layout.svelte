<script lang="ts">
	import '../app.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Download, Upload } from 'lucide-svelte';
	import ImportDialog from '$lib/components/ImportDialog.svelte';
	import ExportDialog from '$lib/components/ExportDialog.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import AnimatedLogo from '$lib/components/AnimatedLogo.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte.js';
	import { themeStore } from '$lib/stores/theme.svelte.js';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'

	// Only inject analytics in production
	if (import.meta.env.PROD) {
		injectAnalytics({ mode: 'production' });
	} else {
		injectAnalytics({ mode: 'development' });
	}

	let { children } = $props();

	// Dialog state
	let showImportDialog = $state(false);
	let showExportDialog = $state(false);
	
	// URL status - derive from settings store
	let hasSharedConfig = $derived(() => {
		// Check if there are user settings that would be shared via URL
		return settingsStore.changedPaths.size > 0;
	});

	// Import/Export handlers
	function handleImport() {
		showImportDialog = true;
	}

	function handleExport() {
		showExportDialog = true;
	}

	function handleImportSettings(settings: any) {
		settingsStore.loadUserSettings(settings);
	}
</script>

<svelte:head>
	<!-- Favicon -->
	<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />

	<script>
		// Apply theme immediately to prevent FOUC
		try {
			const savedTheme = localStorage.getItem('theme');
			if (savedTheme === 'dark') {
				document.documentElement.classList.add('dark');
			} else if (savedTheme === 'light') {
				document.documentElement.classList.remove('dark');
			} else if (savedTheme === 'system' || !savedTheme) {
				// For system theme or no saved preference, check system preference
				if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
		} catch (e) {
			// Fallback to light mode if localStorage is not available
			document.documentElement.classList.remove('dark');
		}
	</script>
	<title>ZedSet - A GUI editor for Zed editor settings</title>
	<meta name="description" content="GUI editor for Zed editor settings" />
</svelte:head>

<div class="mx-auto min-h-screen max-w-7xl bg-background">
	<!-- Header -->
	<header
		class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="flex h-14 items-center px-4">
			<div class="flex items-center space-x-2">
				<AnimatedLogo />
			</div>

			<div class="ml-auto flex items-center space-x-3">
				<!-- URL Status -->
				{#if hasSharedConfig()}
					<div class="flex items-center space-x-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs dark:bg-blue-950/50">
						<div class="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
						<span class="text-blue-700 dark:text-blue-300 font-medium">Saved to URL</span>
					</div>
				{/if}

				<Button variant="outline" size="sm" onclick={handleImport} class="hidden sm:inline-flex">
					<Upload class="mr-2 h-4 w-4" />
					Import Settings
				</Button>

				<Button variant="outline" size="sm" onclick={handleExport} class="hidden sm:inline-flex">
					<Download class="mr-2 h-4 w-4" />
					Export / Share
				</Button>

				<!-- GitHub Link -->
				<a
					href="https://github.com/paulp-o/zedset"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center justify-center rounded-md bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0"
					aria-label="GitHub Repository"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
					</svg>
				</a>

				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1">
		{@render children?.()}
	</main>

	<!-- Dialogs -->
	<ImportDialog
		open={showImportDialog}
		defaults={settingsStore.defaults}
		onImport={handleImportSettings}
		onClose={() => (showImportDialog = false)}
	/>

	<ExportDialog
		open={showExportDialog}
		effective={settingsStore.effective}
		defaults={settingsStore.defaults}
		user={settingsStore.user}
		delta={settingsStore.delta}
		schema={settingsStore.schema || undefined}
		onClose={() => (showExportDialog = false)}
	/>
</div>
