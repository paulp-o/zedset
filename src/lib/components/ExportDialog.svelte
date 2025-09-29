<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible/index.js';
	import {
		Download,
		Copy,
		CheckCircle,
		AlertCircle,
		FileText,
		Link,
		Share,
		ChevronDown
	} from 'lucide-svelte';
	import { downloadFile } from '$lib/core/file-operations.js';
	import {
		generateShareUrl,
		getEstimatedUrlLength,
		checkUrlLength,
		compressSettings
	} from '$lib/core/url-sharing.js';
	import type { ExportResult } from '$lib/core/file-operations.js';
	import type { SettingsObject, JsonSchema } from '$lib/types/index.js';

	interface Props {
		open: boolean;
		effective: SettingsObject;
		defaults: SettingsObject;
		user: SettingsObject;
		delta: SettingsObject;
		schema?: JsonSchema;
		onClose: () => void;
	}

	let { open, effective, defaults, user, delta, schema, onClose }: Props = $props();

	// State
	let exportResult = $state<ExportResult | null>(null);
	let isExporting = $state(false);
	let copied = $state(false);
	let shareUrl = $state<string>('');
	let urlCopied = $state(false);

	// Collapsible state
	let showExportErrors = $state(false);

	// Export on dialog open
	$effect(() => {
		if (open && !exportResult && !isExporting) {
			handleExport();
		}
	});

	// Generate share URL when delta changes
	$effect(() => {
		const deltaKeys = Object.keys(delta || {});
		if (deltaKeys.length > 0) {
			try {
				shareUrl = generateShareUrl(delta);
			} catch (error) {
				shareUrl = '';
			}
		} else {
			shareUrl = '';
		}
	});

	async function handleExport() {
		if (isExporting) return;

		isExporting = true;
		copied = false;

		try {
			// Use the pre-computed delta from the store instead of recalculating
			const deltaKeys = Object.keys(delta || {});

			if (deltaKeys.length === 0) {
				// No changes to export
				exportResult = {
					success: true,
					json: '{}',
					filename: generateFilename(),
					errors: []
				};
			} else {
				// Export the delta as pretty-printed JSON
				const json = JSON.stringify(delta, null, 2);
				exportResult = {
					success: true,
					json,
					filename: generateFilename(),
					errors: []
				};
			}
		} catch (error) {
			exportResult = {
				success: false,
				errors: [error instanceof Error ? error.message : 'Unknown export error']
			};
		} finally {
			isExporting = false;
		}
	}

	// Helper function to generate filename
	function generateFilename(): string {
		// const now = new Date();
		// const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
		return `settings.json`;
	}

	function handleDownload() {
		if (exportResult?.success && exportResult.json && exportResult.filename) {
			try {
				downloadFile(exportResult.json, exportResult.filename);
			} catch (error) {
				console.error('Download failed:', error);
			}
		}
	}

	async function handleCopy() {
		if (exportResult?.success && exportResult.json) {
			try {
				await navigator.clipboard.writeText(exportResult.json);
				copied = true;
				setTimeout(() => {
					copied = false;
				}, 2000);
			} catch (error) {
				console.error('Copy failed:', error);
			}
		}
	}

	async function handleCopyUrl() {
		if (shareUrl) {
			try {
				await navigator.clipboard.writeText(shareUrl);
				urlCopied = true;
				setTimeout(() => {
					urlCopied = false;
				}, 2000);
			} catch (error) {
				console.error('URL copy failed:', error);
			}
		}
	}

	function handleClose() {
		exportResult = null;
		copied = false;
		shareUrl = '';
		urlCopied = false;
		onClose();
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			handleClose();
		}
	}

	// Computed properties
	let hasChanges = $derived(() => {
		return exportResult?.success && exportResult.json && exportResult.json !== '{}';
	});

	let changeCount = $derived(() => {
		if (!exportResult?.success || !exportResult.json) return 0;
		try {
			const parsed = JSON.parse(exportResult.json);
			return Object.keys(parsed).length;
		} catch {
			return 0;
		}
	});

	let urlStatus = $derived(() => {
		if (!shareUrl) return null;
		const length = shareUrl.length;
		return {
			length,
			warning: checkUrlLength(length)
		};
	});
</script>

<Dialog {open} onOpenChange={handleOpenChange}>
	<DialogContent class="max-h-[90vh] w-full" style="max-width: 70rem;">
		<DialogHeader>
			<DialogTitle>Export Settings</DialogTitle>
			<DialogDescription>Export your current settings as JSON or share via URL</DialogDescription>
		</DialogHeader>

		<div class="max-h-[80vh] overflow-y-auto">
			{#if isExporting}
				<div class="flex items-center justify-center py-8">
					<div class="text-center">
						<div
							class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
						></div>
						<p class="text-sm text-muted-foreground">Generating export...</p>
					</div>
				</div>
			{:else if exportResult}
				{#if exportResult.success}
					<!-- Success State -->
					<div class="space-y-6">
						<!-- Status Alert -->
						{#if hasChanges()}
							<Alert>
								<CheckCircle class="h-4 w-4" />
								<AlertDescription>
									Ready to export {changeCount()} setting{changeCount() !== 1 ? 's' : ''} that differ
									from defaults.
								</AlertDescription>
							</Alert>
						{:else}
							<Alert>
								<FileText class="h-4 w-4" />
								<AlertDescription>
									No changes detected. Your settings match the defaults.
								</AlertDescription>
							</Alert>
						{/if}

						<!-- Two Column Layout -->
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<!-- Left Column: JSON Preview -->
							<div class="space-y-4">
								<div class="border-b pb-3">
									<h3 class="text-lg font-semibold">Config Content</h3>
									<p class="text-sm text-muted-foreground">Preview your configuration</p>
								</div>

								<Textarea
									readonly
									value={exportResult.json}
									class="min-h-[400px] resize-none bg-muted font-mono text-sm"
									placeholder="Loading..."
								/>
								{#if exportResult.filename}
									<p class="text-xs text-muted-foreground">
										Copy this file to your Zed config directory. <a
											href="https://zed.dev/docs/configuring-zed#settings-files"
											target="_blank"
											class="text-primary underline">Where is it?</a
										>
									</p>
								{/if}

								<!-- JSON Export Actions -->
								<div class="flex gap-3">
									<Button
										onclick={handleDownload}
										disabled={!hasChanges()}
										class="flex-1 justify-start"
										size="lg"
									>
										<Download class="mr-2 h-5 w-5" />
										{#if hasChanges()}
											Download JSON File
										{:else}
											No Changes to Download
										{/if}
									</Button>
									<Button
										variant="outline"
										onclick={handleCopy}
										disabled={!exportResult.json}
										class="flex-1 justify-start"
										size="lg"
									>
										{#if copied}
											<CheckCircle class="mr-2 h-5 w-5" />
											JSON Copied!
										{:else}
											<Copy class="mr-2 h-5 w-5" />
											Copy to Clipboard
										{/if}
									</Button>
								</div>
							</div>

							<!-- Right Column: Share Actions -->
							<div class="space-y-6">
								<div class="border-b pb-3">
									<h3 class="text-lg font-semibold">Share Configuration</h3>
									<p class="text-sm text-muted-foreground">Share your settings</p>
								</div>

								<!-- Share Section -->
								{#if shareUrl && hasChanges()}
									<div class="space-y-4">
										<div class="space-y-2">
											<Label class="text-xs text-muted-foreground">Share URL Preview</Label>
											<div class="flex gap-2">
												<Textarea
													readonly
													value={shareUrl}
													class="max-h-[120px] min-h-[80px] flex-1 resize-none bg-muted font-mono text-xs"
													placeholder="Generating share URL..."
												/>
												<Button
													variant="outline"
													onclick={handleCopyUrl}
													class="h-[80px] shrink-0"
													size="sm"
												>
													{#if urlCopied}
														<CheckCircle class="mr-1 h-4 w-4" />
														Copied!
													{:else}
														<Link class="mr-1 h-4 w-4" />
														Copy
													{/if}
												</Button>
											</div>
											<!-- {#if urlStatus()}
												{@const status = urlStatus()}
												{#if status}
													<div class="flex items-center space-x-2">
														<div class="h-2 w-2 rounded-full {status.warning === 'error' ? 'bg-red-500' : status.warning === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}"></div>
														<p class="text-xs text-muted-foreground">
															{status.length} characters
															{#if status.warning === 'warning'}
																- may be too long for some systems
															{:else if status.warning === 'error'}
																- too long for most browsers
															{:else}
																- safe length
															{/if}
														</p>
													</div>
												{/if}
											{/if} -->
										</div>
									</div>
								{:else}
									<div class="py-4 text-center">
										<p class="text-sm text-muted-foreground">No changes to share</p>
									</div>
								{/if}

								<!-- Share link will be generated automatically -->
								{#if !shareUrl && hasChanges()}
									<div class="py-4 text-center">
										<p class="text-sm text-muted-foreground">
											Share link will be generated automatically
										</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<!-- Error State -->
					<Collapsible bind:open={showExportErrors}>
						<Alert variant="destructive">
							<AlertCircle class="h-4 w-4" />
							<AlertDescription>
								<div class="flex items-center justify-between">
									<div class="font-medium">Export Failed</div>
									<CollapsibleTrigger
										class="flex h-auto cursor-pointer items-center gap-1 rounded p-1 text-xs transition-colors hover:bg-muted"
									>
										<ChevronDown
											class="h-3 w-3 transition-transform {showExportErrors ? 'rotate-180' : ''}"
										/>
										{showExportErrors ? 'Hide' : 'Show'} Details
									</CollapsibleTrigger>
								</div>
								<CollapsibleContent class="mt-2">
									<ul class="list-inside list-disc">
										{#each exportResult.errors as error}
											<li class="text-sm">{error}</li>
										{/each}
									</ul>
								</CollapsibleContent>
							</AlertDescription>
						</Alert>
					</Collapsible>
				{/if}
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Close</Button>
			{#if !exportResult?.success && !isExporting}
				<Button onclick={handleExport}>Try Again</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
