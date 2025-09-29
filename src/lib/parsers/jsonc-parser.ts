import {
	parseTree,
	getNodeValue,
	type ParseError,
	type Node,
	type ParseOptions
} from 'jsonc-parser';
import { dev } from '$app/environment';
import type { JsoncParseResult, DocsMap, SettingsObject, JsonPointer } from '$lib/types';

/**
 * URL to fetch live default settings from Zed GitHub repository
 */
export const ZED_DEFAULT_SETTINGS_URL =
	'https://raw.githubusercontent.com/zed-industries/zed/refs/heads/main/assets/settings/default.json';

/**
 * Local path to default settings for development
 */
export const LOCAL_DEFAULT_SETTINGS_PATH = '/default.settings.jsonc';

/**
 * Fetches the default settings JSONC from either local file (dev) or GitHub (production)
 */
export async function fetchDefaultSettings(): Promise<string> {
	try {
		const url = dev ? LOCAL_DEFAULT_SETTINGS_PATH : ZED_DEFAULT_SETTINGS_URL;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch default settings: ${response.status} ${response.statusText}`
			);
		}

		const content = await response.text();

		if (!content.trim()) {
			throw new Error('Default settings file is empty');
		}

		return content;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Error fetching default settings: ${error.message}`);
		}
		throw new Error('Unknown error fetching default settings');
	}
}

/**
 * Fetches default settings from the live Zed GitHub repository (force production mode)
 */
export async function fetchLiveDefaultSettings(): Promise<string> {
	try {
		const response = await fetch(ZED_DEFAULT_SETTINGS_URL);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch live default settings: ${response.status} ${response.statusText}`
			);
		}

		const content = await response.text();

		if (!content.trim()) {
			throw new Error('Live default settings file is empty');
		}

		return content;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Network error fetching live default settings: ${error.message}`);
		}
		throw new Error('Unknown error fetching live default settings');
	}
}

/**
 * Parses JSONC content and extracts both values and documentation from comments
 */
export function parseJsoncWithDocs(jsonc: string): JsoncParseResult {
	const errors: string[] = [];

	try {
		// Parse the JSONC into an AST
		const parseErrors: ParseError[] = [];
		const tree = parseTree(jsonc, parseErrors, {
			allowTrailingComma: true,
			allowEmptyContent: false,
			disallowComments: false
		} as ParseOptions);

		// Convert parse errors to strings
		if (parseErrors.length > 0) {
			errors.push(
				...parseErrors.map(
					(err) => `Parse error at offset ${err.offset}: ${err.error} (length: ${err.length})`
				)
			);
		}

		if (!tree) {
			return {
				value: {},
				docs: {},
				errors: ['Failed to parse JSONC: No valid JSON tree found']
			};
		}

		// Extract the actual values
		const value = getNodeValue(tree) as SettingsObject;

		// Extract documentation from comments
		const docs = extractDocumentation(jsonc, tree);

		return {
			value: value || {},
			docs,
			errors
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
		return {
			value: {},
			docs: {},
			errors: [`JSONC parsing failed: ${errorMessage}`]
		};
	}
}

/**
 * Extracts documentation from comments in the JSONC source
 * Maps JSON pointers to human-readable descriptions
 */
function extractDocumentation(jsonc: string, tree: Node): DocsMap {
	const docs: DocsMap = {};
	const lines = jsonc.split('\n');

	// Find all comment blocks and associate them with the next property
	const comments: Array<{
		startLine: number;
		endLine: number;
		text: string;
		type: 'block' | 'line';
	}> = [];

	// Extract comments with better handling for multi-line comments
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Line comments
		const lineCommentMatch = line.match(/^\s*\/\/\s*(.*)$/);
		if (lineCommentMatch) {
			const text = lineCommentMatch[1].trim();
			if (text) {
				// Only add non-empty comments
				comments.push({
					startLine: i,
					endLine: i,
					text,
					type: 'line'
				});
			}
			continue;
		}

		// Block comments (simplified - assumes single-line blocks for now)
		const blockCommentMatch = line.match(/^\s*\/\*\s*(.*?)\s*\*\/$/);
		if (blockCommentMatch) {
			const text = blockCommentMatch[1].trim();
			if (text) {
				comments.push({
					startLine: i,
					endLine: i,
					text,
					type: 'block'
				});
			}
			continue;
		}
	}

	// Group consecutive line comments into single documentation blocks
	const groupedComments: Array<{ startLine: number; endLine: number; text: string }> = [];
	let currentGroup: Array<{ startLine: number; text: string }> = [];

	for (const comment of comments) {
		if (comment.type === 'line') {
			// Check if this continues the current group (consecutive lines)
			if (
				currentGroup.length === 0 ||
				comment.startLine === currentGroup[currentGroup.length - 1].startLine + 1
			) {
				currentGroup.push({ startLine: comment.startLine, text: comment.text });
			} else {
				// Finalize current group and start new one
				if (currentGroup.length > 0) {
					groupedComments.push({
						startLine: currentGroup[0].startLine,
						endLine: currentGroup[currentGroup.length - 1].startLine,
						text: currentGroup.map((c) => c.text).join('\n')
					});
				}
				currentGroup = [{ startLine: comment.startLine, text: comment.text }];
			}
		} else {
			// Block comment - finalize any current group and add block comment
			if (currentGroup.length > 0) {
				groupedComments.push({
					startLine: currentGroup[0].startLine,
					endLine: currentGroup[currentGroup.length - 1].startLine,
					text: currentGroup.map((c) => c.text).join('\n')
				});
				currentGroup = [];
			}
			groupedComments.push({
				startLine: comment.startLine,
				endLine: comment.endLine,
				text: comment.text
			});
		}
	}

	// Don't forget the last group
	if (currentGroup.length > 0) {
		groupedComments.push({
			startLine: currentGroup[0].startLine,
			endLine: currentGroup[currentGroup.length - 1].startLine,
			text: currentGroup.map((c) => c.text).join('\n')
		});
	}

	// For each comment group, try to find the next property and create documentation
	for (const comment of groupedComments) {
		// Look for the next property definition after this comment
		for (let i = comment.endLine + 1; i < lines.length; i++) {
			const line = lines[i];
			const propertyMatch = line.match(/^\s*"([^"]+)"\s*:/);

			if (propertyMatch) {
				const propertyName = propertyMatch[1];

				// Determine the full path by analyzing the context
				const fullPath = determinePropertyPath(lines, i);
				const pointer: JsonPointer = fullPath || propertyName;

				// If we don't already have docs for this property, add it
				if (!docs[pointer]) {
					docs[pointer] = comment.text;
				}
				break;
			}

			// If we hit another comment or a closing brace, stop
			if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim() === '}') {
				break;
			}
		}
	}

	return docs;
}

/**
 * Determines the full JSON path for a property by analyzing the nesting context
 */
function determinePropertyPath(lines: string[], lineIndex: number): string | null {
	const currentLine = lines[lineIndex];
	const currentPropertyMatch = currentLine.match(/^\s*"([^"]+)"\s*:/);

	if (!currentPropertyMatch) {
		return null;
	}

	const currentProperty = currentPropertyMatch[1];
	const path: string[] = [];

	// Track indentation to determine nesting levels
	let currentIndent = currentLine.match(/^(\s*)/)?.[1].length || 0;

	// Walk backwards to find parent objects
	for (let i = lineIndex - 1; i >= 0; i--) {
		const line = lines[i];
		const lineIndent = line.match(/^(\s*)/)?.[1].length || 0;

		// Look for property definitions that start objects at a shallower indentation level
		const objectPropertyMatch = line.match(/^\s*"([^"]+)"\s*:\s*\{/);
		if (objectPropertyMatch && lineIndent < currentIndent) {
			path.unshift(objectPropertyMatch[1]);
			// Update current indent to look for even shallower parent levels
			currentIndent = lineIndent;
		}

		// Stop if we hit the root level
		if (lineIndent === 0 && (line.trim() === '{' || i === 0)) {
			break;
		}
	}

	// Add the current property
	path.push(currentProperty);

	// Return the full path - always return the path, even for root level properties
	return path.join('.');
}

/**
 * Convenience function to fetch and parse default settings in one call
 * Uses local file in development, live fetch in production
 */
export async function loadDefaultSettings(): Promise<JsoncParseResult> {
	try {
		const jsonc = await fetchDefaultSettings();
		return parseJsoncWithDocs(jsonc);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			value: {},
			docs: {},
			errors: [errorMessage]
		};
	}
}

/**
 * Convenience function to fetch and parse live default settings from GitHub
 * Always fetches from the live repository regardless of environment
 */
export async function loadLiveDefaultSettings(): Promise<JsoncParseResult> {
	try {
		const jsonc = await fetchLiveDefaultSettings();
		return parseJsoncWithDocs(jsonc);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return {
			value: {},
			docs: {},
			errors: [errorMessage]
		};
	}
}
