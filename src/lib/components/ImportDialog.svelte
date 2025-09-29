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
	import { Upload, FileText, AlertCircle, CheckCircle, ChevronDown } from 'lucide-svelte';
	import {
		importSettingsFile,
		importSettingsText,
		validateImportedSettings
	} from '$lib/core/file-operations.js';
	import type { ImportResult } from '$lib/core/file-operations.js';
	import type { SettingsObject } from '$lib/types/index.js';

	interface Props {
		open: boolean;
		defaults: SettingsObject;
		onImport: (settings: SettingsObject) => void;
		onClose: () => void;
	}

	let { open, defaults, onImport, onClose }: Props = $props();

	// State
	let textContent = $state('');
	let selectedFile = $state<File | null>(null);
	let importResult = $state<ImportResult | null>(null);
	let isImporting = $state(false);
	let validationResult = $state<any>(null);

	// Collapsible state
	let showUnknownKeys = $state(false);
	let showValidationErrors = $state(false);
	let showImportDetails = $state(false);

	// File input element
	let fileInput = $state<HTMLInputElement>();

	// Import methods
	let importMethod = $state<'file' | 'text'>('file');

	// Debounce timeout for text validation
	let validationTimeout: ReturnType<typeof setTimeout> | undefined;

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFile = target.files?.[0] || null;
		if (selectedFile) {
			importMethod = 'file';
			textContent = '';
			await performValidation();
		}
	}

	function handleTextChange() {
		// Clear any existing timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}

		if (textContent.trim()) {
			importMethod = 'text';
			selectedFile = null;

			// Debounce validation to avoid excessive calls while typing
			validationTimeout = setTimeout(() => {
				performValidation();
			}, 500);
		} else {
			// Clear validation when text is empty
			importResult = null;
			validationResult = null;
		}
	}

	// Track previous textContent to avoid infinite loops
	let previousTextContent = $state('');

	// Watch for textContent changes in Svelte 5 reactive way
	$effect(() => {
		// This will trigger whenever textContent changes (including paste)
		if (textContent !== previousTextContent) {
			previousTextContent = textContent;
			handleTextChange();
		}
	});

	async function performValidation() {
		if (isImporting) return;

		isImporting = true;
		importResult = null;
		validationResult = null;

		try {
			let result: ImportResult;

			if (importMethod === 'file' && selectedFile) {
				result = await importSettingsFile(selectedFile);
			} else if (importMethod === 'text' && textContent.trim()) {
				result = importSettingsText(textContent.trim());
			} else {
				importResult = {
					success: false,
					errors: ['Please select a file or enter settings text'],
					warnings: []
				};
				return;
			}

			importResult = result;

			if (result.success && result.data) {
				// Validate against defaults
				validationResult = validateImportedSettings(result.data, defaults);
			}
		} catch (error) {
			importResult = {
				success: false,
				errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
				warnings: []
			};
		} finally {
			isImporting = false;
		}
	}

	function handleImport() {
		if (importResult?.success && importResult.data) {
			onImport(importResult.data);
			handleClose();
		}
	}

	function handleClose() {
		// Clear any pending validation timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
			validationTimeout = undefined;
		}

		// Reset state
		textContent = '';
		previousTextContent = '';
		selectedFile = null;
		importResult = null;
		validationResult = null;
		importMethod = 'file';
		isImporting = false;
		onClose();
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			handleClose();
		}
	}

	// Computed properties
	let canImport = $derived(() => {
		return importResult?.success && importResult.data;
	});

	let showValidation = $derived(() => {
		return importResult?.success && validationResult;
	});
</script>

<Dialog {open} onOpenChange={handleOpenChange}>
	<DialogContent class="max-h-[90vh] max-w-2xl">
		<DialogHeader>
			<DialogTitle>Import Settings</DialogTitle>
			<DialogDescription>Import your existing Zed settings from a file or text</DialogDescription>
		</DialogHeader>

		<div class="max-h-[60vh] space-y-6 overflow-y-auto">
			<!-- Import Methods -->
			<div class="space-y-4">
				<!-- File Upload -->
				<div class="space-y-2">
					<Label class="text-sm font-medium">
						From Config File
						{#if isImporting && importMethod === 'file'}
							<span class="ml-2 text-xs text-muted-foreground">(Validating...)</span>
						{/if}
					</Label>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<Button variant="outline" onclick={() => fileInput?.click()} class="flex-shrink-0">
								<Upload class="mr-2 h-4 w-4" />
								Choose File
							</Button>

							{#if selectedFile}
								<div class="flex items-center gap-2 text-sm">
									<FileText class="h-4 w-4" />
									<span>{selectedFile.name}</span>
									<span class="text-muted-foreground">
										({(selectedFile.size / 1024).toFixed(1)} KB)
									</span>
								</div>
							{/if}
						</div>
						<span class="text-xs text-muted-foreground">
							The file <u>isn't being uploaded</u> to anywhere. Everything stays in your browser.
						</span>
					</div>
					<input
						bind:this={fileInput}
						type="file"
						accept=".json,.jsonc"
						onchange={handleFileSelect}
						class="hidden"
					/>
				</div>

				<!-- Divider -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t"></div>
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-background px-2 text-muted-foreground">Or</span>
					</div>
				</div>

				<!-- Text Input -->
				<div class="space-y-2">
					<Label for="settings-text" class="text-sm font-medium">
						Paste Settings (JSON/JSONC)
						{#if isImporting && importMethod === 'text'}
							<span class="ml-2 text-xs text-muted-foreground">(Validating...)</span>
						{/if}
					</Label>
					<Textarea
						id="settings-text"
						bind:value={textContent}
						placeholder="Paste your settings here..."
						class="min-h-[120px] font-mono text-sm"
					/>
				</div>
			</div>

			<!-- Import Result -->
			{#if importResult}
				<div class="space-y-3">
					{#if importResult.success}
					

						{#if showValidation()}
							<div class="space-y-2 text-sm">
								<div class="font-medium">Import Summary:</div>
								<div class="text-muted-foreground">{validationResult.summary}</div>

								{#if validationResult.unknownKeys.length > 0}
									<Collapsible bind:open={showUnknownKeys} >
										<Alert variant="destructive" class="text-yellow-500">
											<AlertCircle class="h-4 w-4 text-yellow-500"  />
											<AlertDescription>
												<div class="flex items-center justify-between w-full">
													<div class="font-medium text-yellow-500">
														{validationResult.unknownKeys.length} Unknown Setting{validationResult.unknownKeys.length !== 1 ? 's' : ''} Found
													</div>
													<CollapsibleTrigger class="flex text-yellow-500 items-center gap-1 h-auto p-1 text-xs hover:bg-muted rounded transition-colors cursor-pointer">
														<ChevronDown class="h-3 w-3 transition-transform {showUnknownKeys ? 'rotate-180' : ''}" />
														{showUnknownKeys ? 'Hide' : 'Show'} Details
													</CollapsibleTrigger>
												</div>
												<CollapsibleContent class="mt-2">
													<ul class="list-inside list-disc text-yellow-500">
														{#each validationResult.unknownKeys as key}
															<li class="font-mono text-xs">{key}</li>
														{/each}
													</ul>
													<p class="mt-2 text-xs text-yellow-500">
														The default values for the above imported settings were not found in the official Zed default settings data. This doesn't necessarily mean that these values are invalid; It might be custom settings you need for your extensions, or just valid data that is not yet on the default settings data. You might need to read the related docs on the Zed official docs webpage, accessible directly from the editor.
													</p>
												</CollapsibleContent>
											</AlertDescription>
										</Alert>
									</Collapsible>
								{/if}

								{#if validationResult.errors.length > 0}
									<Collapsible bind:open={showValidationErrors}>
										<Alert variant="destructive" class="text-red-500">
											<AlertCircle class="h-4 w-4" />
											<AlertDescription>
												<div class="flex items-center justify-between">
													<div class="font-medium text-red-500">
														{validationResult.errors.length} Validation Error{validationResult.errors.length !== 1 ? 's' : ''}
													</div>
													<CollapsibleTrigger class="flex items-center gap-1 h-auto p-1 text-xs hover:bg-muted rounded transition-colors cursor-pointer">
														<ChevronDown class="h-3 w-3 transition-transform {showValidationErrors ? 'rotate-180' : ''}" />
														{showValidationErrors ? 'Hide' : 'Show'} Details
													</CollapsibleTrigger>
												</div>
												<CollapsibleContent class="mt-2">
													<ul class="list-inside list-disc">
														{#each validationResult.errors as error}
															<li class="text-xs">{error.message} (at {error.path})</li>
														{/each}
													</ul>
												</CollapsibleContent>
											</AlertDescription>
										</Alert>
									</Collapsible>
								{/if}
							</div>
						{/if}
					{:else}
						<Collapsible bind:open={showImportDetails}>
							<Alert variant="destructive">
								<AlertCircle class="h-4 w-4" />
								<AlertDescription>
									<div class="flex items-center justify-between">
										<div class="font-medium">Import Failed</div>
										<CollapsibleTrigger class="flex items-center gap-1 h-auto p-1 text-xs hover:bg-muted rounded transition-colors cursor-pointer">
											<ChevronDown class="h-3 w-3 transition-transform {showImportDetails ? 'rotate-180' : ''}" />
											{showImportDetails ? 'Hide' : 'Show'} Details
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent class="mt-2">
										<ul class="list-inside list-disc">
											{#each importResult.errors as error}
												<li class="text-sm">{error}</li>
											{/each}
										</ul>
									</CollapsibleContent>
								</AlertDescription>
							</Alert>
						</Collapsible>
					{/if}	<div class="flex items-center gap-2 rounded-md border-0 border-none bg-green-50 px-3 py-2 text-green-700  dark:bg-green-950/40 dark:text-green-300 backdrop-blur-sm">
							<CheckCircle class="h-4 w-4" />
							<div>
								<span class="font-medium">Settings imported successfully!</span>
								{#if importResult.warnings.length > 0}
									<br />
									<span class="text-yellow-700 dark:text-yellow-300">
										Warnings: {importResult.warnings.join(', ')}
									</span>
								{/if}
							</div>
						</div>
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleClose}>Cancel</Button>
			<Button onclick={handleImport} disabled={!canImport || isImporting}>
				{#if isImporting}
					Validating...
				{:else if importResult && !importResult.success}
					Import Failed
				{:else if canImport()}
					Import Settings
				{:else}
					No Valid Data
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
