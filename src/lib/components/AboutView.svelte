<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ExternalLink } from 'lucide-svelte';
</script>

<div class="flex-1 overflow-y-auto">
	<!-- Stagelight Effect moved to outer scope -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-sm"
		></div>
		<div
			class="absolute top-0 left-1/2 h-full w-96 -translate-x-1/2 -translate-y-1/4 rotate-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-2xl"
		></div>
		<div
			class="absolute top-0 left-1/2 h-full w-96 -translate-x-1/2 translate-y-1/4 -rotate-12 bg-gradient-to-l from-transparent via-primary/10 to-transparent blur-2xl"
		></div>
	</div>

	<div class="mx-auto max-w-4xl px-6 py-16">
		<!-- Hero Section -->
		<div class="relative mb-12 space-y-6 text-center">
			<div class="relative space-y-4">
				<h1 class="text-6xl font-light tracking-tight text-foreground drop-shadow-sm">
					Zed<span class="font-bold">Set</span>
				</h1>
				<p class="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground drop-shadow-sm">
					A lightweight GUI tool for working with<br /> Zed Editor's settings. Built for simplicity.
				</p>
			</div>

			<div class="relative flex flex-wrap justify-center gap-3">
				<Badge variant="secondary" class="px-4 py-2 text-sm drop-shadow-sm">fast</Badge>
				<Badge variant="secondary" class="px-4 py-2 text-sm drop-shadow-sm">stateless</Badge>
				<Badge variant="secondary" class="px-4 py-2 text-sm drop-shadow-sm">privacy</Badge>
			</div>
		</div>

		<!-- Introduction -->
		<div class="prose prose-lg mx-auto mb-16 max-w-4xl">
			<div class="space-y-6 text-left">
				<p class="text-lg leading-relaxed text-muted-foreground">
					ZedSet is a lightweight tool for loading, editing, sharing, and exporting Zed Editor
					settings.
				</p>

				<div class="space-y-4 leading-relaxed text-muted-foreground">
					<p>
						<a
							href="https://zed.dev"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-primary transition-colors hover:text-primary/80">Zed</a
						>
						is an exciting editor: native, pure, and high-performance—without the Electron wrapper used
						by many others. I have a whole list of good things about using Zed, but
						<a
							href="https://simple.wikipedia.org/wiki/Fermat%27s_Last_Theorem"
							class="italic underline decoration-dotted"
						>
							there is not enough space in this margin to write it</a
						>. However, I observed some barriers for some developers to move from another editor.
						One of them is that there's no convenient in-editor UI for tweaking settings.
					</p>

					<p>
						Because of this, more than five people around me gave up on using Zed. And honestly, I
						sometimes miss the ability to simply search for a setting and flip it in a friendly
						panel.
					</p>

					<p class="font-medium text-muted-foreground/80">
						That's why I built ZedSet. <a
							href="https://github.com/paulp-o/zedset"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-primary transition-colors hover:text-primary/80"
							>Repo <ExternalLink class="inline-block h-4 w-4" />
						</a>
					</p>
				</div>
			</div>
		</div>

		<!-- Features Grid -->
		<div class="mb-16">
			<h2 class="mb-12 text-center text-3xl font-light text-foreground">What ZedSet does</h2>
			<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
				<div class="group space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
							<span class="text-lg text-blue-500">📁</span>
						</div>
						<h3 class="font-medium text-foreground">Load your settings</h3>
					</div>
					<p class="ml-11 text-sm leading-relaxed text-muted-foreground">
						Import settings.json or JSONC files, or paste them directly into a clean, intuitive
						interface.
					</p>
				</div>

				<div class="group space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
							<span class="text-lg text-green-500">👁️</span>
						</div>
						<h3 class="font-medium text-foreground">Show inherited defaults</h3>
					</div>
					<p class="ml-11 text-sm leading-relaxed text-muted-foreground">
						See all settings, including those from Zed's defaults that aren't in your config file.
					</p>
				</div>

				<div class="group space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
							<span class="text-lg text-purple-500">✏️</span>
						</div>
						<h3 class="font-medium text-foreground">Edit with confidence</h3>
					</div>
					<p class="ml-11 text-sm leading-relaxed text-muted-foreground">
						Modify values through intuitive controls with explanations from Zed's documentation.
					</p>
				</div>

				<div class="group space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
							<span class="text-lg text-orange-500">🔍</span>
						</div>
						<h3 class="font-medium text-foreground">Search everything</h3>
					</div>
					<p class="ml-11 text-sm leading-relaxed text-muted-foreground">
						Find any setting instantly by name or description with real-time filtering.
					</p>
					</div>
					
				<div class="group space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10">
							<span class="text-lg text-cyan-500">📤</span>
						</div>
						<h3 class="font-medium text-foreground">Export minimal diffs</h3>
					</div>
					<p class="ml-11 text-sm leading-relaxed text-muted-foreground">
						Generate clean settings.json files containing only your changes from defaults.
					</p>
					</div>
					
				<div class="group space-y-3">
					<div class="flex items-center gap-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10">
							<span class="text-lg text-indigo-500">🔗</span>
						</div>
						<h3 class="font-medium text-foreground">Share configurations</h3>
					</div>
					<p class="ml-11 text-sm leading-relaxed text-muted-foreground">
						Share your settings via URL or download them to sync across machines.
					</p>
				</div>
			</div>
		</div>

		<!-- Privacy Note -->
		<div class="mb-12 text-center">
			<div
				class="inline-flex items-center gap-2 rounded border border-muted/30 bg-muted/40 px-4 py-2"
			>
				<span class="text-base text-muted-foreground">🔒</span>
				<span class="text-sm text-muted-foreground">
					All settings are processed locally in your browser.
				</span>
			</div>
					</div>
					
		<!-- Usage Steps -->
		<div class="mb-16">
			<h2 class="mb-12 text-center text-3xl font-light text-foreground">How to use ZedSet</h2>
			<div class="space-y-8">
				<div class="flex items-start gap-6">
					<div
						class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary"
					>
						<span class="text-sm font-medium text-primary-foreground">1</span>
					</div>
					<div>
						<h3 class="mb-2 font-medium text-foreground">Browse settings</h3>
						<p class="text-muted-foreground">
							Navigate categories like Appearance, Editor, and Terminal using the sidebar. Click any
							group to jump to that section.
						</p>
					</div>
				</div>

				<div class="flex items-start gap-6">
					<div
						class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary"
					>
						<span class="text-sm font-medium text-primary-foreground">2</span>
					</div>
					<div>
						<h3 class="mb-2 font-medium text-foreground">Search & modify</h3>
						<p class="text-muted-foreground">
							Use the search bar to find specific settings, then edit values directly. Changes are
							highlighted automatically.
						</p>
					</div>
					</div>
					
				<div class="flex items-start gap-6">
					<div
						class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary"
					>
						<span class="text-sm font-medium text-primary-foreground">3</span>
					</div>
					<div>
						<h3 class="mb-2 font-medium text-foreground">Export & share</h3>
						<p class="text-muted-foreground">
							Download your settings as JSON, copy to clipboard, or share via URL with your team.
						</p>
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
		<div class="border-t border-border pt-8 text-center">
			<p class="mb-6 flex flex-wrap items-center justify-center gap-3 text-muted-foreground">
				Made with
				<img
					src="https://raw.githubusercontent.com/sveltejs/branding/master/svelte-logo-cutout.svg"
					alt="Svelte"
					class="inline-block h-6 w-6"
				/>
				by
				<a
					href="https://github.com/paulp-o"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium text-primary transition-colors hover:underline"
				>
					Paul Park
				</a>
			</p>

			<!-- Action buttons -->
			<div class="flex flex-wrap items-center justify-center gap-4">
				<!-- GitHub Repository Button -->
				<a
					href="https://github.com/paulp-o"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-gray-800"
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
				<a href="https://www.buymeacoffee.com/paulp.o" target="_blank"
					><img
						src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
						alt="Buy Me A Coffee"
						style="height: 40px !important;width: 145px !important;"
					/></a
				>
			</div>
		</div>
	</div>
</div>
