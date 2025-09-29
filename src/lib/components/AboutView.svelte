<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
</script>

<div class="flex-1 overflow-y-auto">
	<div class="max-w-4xl mx-auto px-6 py-16">
		<!-- Hero Section -->
		<div class="text-center space-y-6 mb-20">
			<div class="space-y-4">
				<h1 class="text-6xl font-light text-foreground tracking-tight">
					Zed<span class="font-bold">Set</span>
				</h1>
				<p class="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					A lightweight GUI tool for editing Zed Editor settings with style and simplicity
				</p>
			</div>
			
			<div class="flex justify-center gap-3 flex-wrap">
				<Badge variant="secondary" class="px-4 py-2 text-sm">fast</Badge>
				<Badge variant="secondary" class="px-4 py-2 text-sm">stateless</Badge>
				<Badge variant="secondary" class="px-4 py-2 text-sm">privacy</Badge>
			</div>
		</div>

		<!-- Introduction -->
		<div class="prose prose-lg max-w-none mb-16 text-center">
			<p class="text-muted-foreground leading-relaxed text-lg mb-6">
				ZedSet is a lightweight tool for loading, editing, sharing, and exporting Zed Editor settings.
			</p>
			<p class="text-muted-foreground leading-relaxed">
				<a href="https://zed.dev" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium transition-colors">Zed</a> is an exciting editor: native, pure, and high-performance—without the Electron wrapper used by many others. Still, some folks hesitate to adopt tools that lack a full GUI for configuration. At least five people around me felt that way—and honestly, sometimes I also miss the convenience of searching for a setting and flipping it in a friendly panel. So I built ZedSet.
			</p>
		</div>

		<!-- Features Grid -->
		<div class="mb-16">
			<h2 class="text-3xl font-light text-center mb-12 text-foreground">What ZedSet does</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div class="space-y-3 group">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
							<span class="text-blue-500 text-lg">📁</span>
						</div>
						<h3 class="font-medium text-foreground">Load your settings</h3>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed ml-11">
						Import settings.json or JSONC files, or paste them directly into a clean, intuitive interface.
					</p>
				</div>

				<div class="space-y-3 group">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
							<span class="text-green-500 text-lg">👁️</span>
						</div>
						<h3 class="font-medium text-foreground">Show inherited defaults</h3>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed ml-11">
						See all settings, including those from Zed's defaults that aren't in your config file.
					</p>
				</div>

				<div class="space-y-3 group">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
							<span class="text-purple-500 text-lg">✏️</span>
						</div>
						<h3 class="font-medium text-foreground">Edit with confidence</h3>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed ml-11">
						Modify values through intuitive controls with explanations from Zed's documentation.
					</p>
				</div>

				<div class="space-y-3 group">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
							<span class="text-orange-500 text-lg">🔍</span>
						</div>
						<h3 class="font-medium text-foreground">Search everything</h3>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed ml-11">
						Find any setting instantly by name or description with real-time filtering.
					</p>
				</div>

				<div class="space-y-3 group">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
							<span class="text-cyan-500 text-lg">📤</span>
						</div>
						<h3 class="font-medium text-foreground">Export minimal diffs</h3>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed ml-11">
						Generate clean settings.json files containing only your changes from defaults.
					</p>
				</div>

				<div class="space-y-3 group">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
							<span class="text-indigo-500 text-lg">🔗</span>
						</div>
						<h3 class="font-medium text-foreground">Share configurations</h3>
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed ml-11">
						Share your settings via URL or download them to sync across machines.
					</p>
				</div>
			</div>
		</div>

		<!-- Privacy Note -->
		<div class="text-center mb-12">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-muted/40 rounded border border-muted/30">
				<span class="text-muted-foreground text-base">🔒</span>
				<span class="text-muted-foreground text-sm">
					All settings are processed locally in your browser.
				</span>
			</div>
		</div>

		<!-- Usage Steps -->
		<div class="mb-16">
			<h2 class="text-3xl font-light text-center mb-12 text-foreground">How to use ZedSet</h2>
			<div class="space-y-8">
				<div class="flex gap-6 items-start">
					<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
						<span class="text-primary-foreground text-sm font-medium">1</span>
					</div>
					<div>
						<h3 class="font-medium text-foreground mb-2">Browse settings</h3>
						<p class="text-muted-foreground">Navigate categories like Appearance, Editor, and Terminal using the sidebar. Click any group to jump to that section.</p>
					</div>
				</div>

				<div class="flex gap-6 items-start">
					<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
						<span class="text-primary-foreground text-sm font-medium">2</span>
					</div>
					<div>
						<h3 class="font-medium text-foreground mb-2">Search & modify</h3>
						<p class="text-muted-foreground">Use the search bar to find specific settings, then edit values directly. Changes are highlighted automatically.</p>
					</div>
				</div>

				<div class="flex gap-6 items-start">
					<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
						<span class="text-primary-foreground text-sm font-medium">3</span>
					</div>
					<div>
						<h3 class="font-medium text-foreground mb-2">Export & share</h3>
						<p class="text-muted-foreground">Download your settings as JSON, copy to clipboard, or share via URL with your team.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Technical Note -->
		<!-- <div class="text-center mb-12">
			<p class="text-sm text-muted-foreground bg-muted/30 px-6 py-4 rounded-lg inline-block max-w-2xl">
				<strong>Note:</strong> Zed uses settings.json (not "settings.config"). ZedSet works with both JSON and JSONC—comments are preserved on input, exports are clean JSON.
			</p>
		</div> -->

		<!-- Footer -->
		<div class="text-center pt-8 border-t border-border">
			<p class="text-muted-foreground flex items-center justify-center gap-3 flex-wrap mb-6">
				Made with
				<img src="https://raw.githubusercontent.com/sveltejs/branding/master/svelte-logo-cutout.svg" alt="Svelte" class="h-6 w-6 inline-block" />
				by
				<a href="https://github.com/paulp-o" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium transition-colors">
					Paul Park
				</a>
			</p>

			<!-- Action buttons -->
			<div class="flex justify-center gap-4 items-center flex-wrap">
				<!-- GitHub Repository Button -->
				<a
					href="https://github.com/paulp-o"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium h-10"
				>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					width="16"
					height="16"
					aria-hidden="true"
					class="inline-block"
					style="color: white;"
				>
					<path
						fill="currentColor"
						d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
					/>
				</svg>
				GitHub
				</a>

				<!-- Buy Me a Coffee Button -->
				<a href="https://www.buymeacoffee.com/paulp.o" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 145px !important;" ></a>
			</div>
		</div>
	</div>
</div>
