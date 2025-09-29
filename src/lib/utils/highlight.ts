export function highlightText(text: string, query: string): string {
	if (!text || !query) return text;
	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(escaped, 'ig');
	return text.replace(regex, (match) => `<mark class="highlight-match">${match}</mark>`);
}
