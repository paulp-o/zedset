/**
 * Simple markdown parser for basic inline formatting
 * Handles: `code`, **bold**, *italic*, and preserves line breaks
 */

/**
 * Converts simple markdown to HTML with subtle styling
 * @param text - The markdown text to convert
 * @returns HTML string with inline styles
 */
export function parseSimpleMarkdown(text: string): string {
	if (!text) return '';

	let html = text;

	// Handle code spans: `code` -> <code>code</code>
	html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

	// Handle bold: **text** -> <strong>text</strong>
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="inline-bold">$1</strong>');

	// Handle italic: *text* -> <em>text</em>
	html = html.replace(/\*([^*]+)\*/g, '<em class="inline-italic">$1</em>');

	// Handle line breaks (preserve whitespace-pre-line behavior)
	html = html.replace(/\n/g, '<br>');

	return html;
}

/**
 * CSS classes for inline markdown elements (to be used in global styles)
 */
export const markdownStyles = `
	:global(.inline-code) {
		background-color: hsl(var(--muted));
		color: hsl(var(--foreground));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.875em;
		font-weight: 500;
	}

	:global(.inline-bold) {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	:global(.inline-italic) {
		font-style: italic;
		color: hsl(var(--muted-foreground));
	}
`;
