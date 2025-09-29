import type { SettingsObject } from '$lib/types/index.js';

/**
 * Encodes settings object to a base64 URL-safe string for sharing
 * @param settings - The settings object to encode
 * @returns Base64 encoded string
 */
export function encodeConfig(settings: SettingsObject): string {
	try {
		const json = JSON.stringify(settings);
		// Use browser's built-in btoa for base64 encoding
		// Then make it URL-safe by replacing characters
		return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	} catch (error) {
		throw new Error('Failed to encode settings');
	}
}

/**
 * Decodes a base64 URL-safe string back to settings object
 * @param encoded - The base64 encoded string
 * @returns Decoded settings object
 */
export function decodeConfig(encoded: string): SettingsObject {
	try {
		// Restore URL-safe base64 to standard base64
		let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

		// Add padding if needed
		while (base64.length % 4) {
			base64 += '=';
		}

		const json = atob(base64);
		return JSON.parse(json);
	} catch (error) {
		throw new Error('Failed to decode settings from URL');
	}
}

/**
 * Generates a shareable URL with settings encoded in the hash
 * @param settings - The settings object to share
 * @param baseUrl - Optional base URL (defaults to current location)
 * @returns Complete shareable URL
 */
export function generateShareUrl(settings: SettingsObject, baseUrl?: string): string {
	const encoded = encodeConfig(settings);
	const base = baseUrl || `${window.location.origin}${window.location.pathname}`;
	return `${base}#config=${encoded}`;
}

/**
 * Parses a share URL to extract settings
 * @param url - The URL to parse (can be full URL or just hash)
 * @returns Settings object if found, null otherwise
 */
export function parseShareUrl(url: string): SettingsObject | null {
	try {
		let hash: string;

		if (url.startsWith('#')) {
			hash = url;
		} else if (url.includes('#')) {
			hash = url.split('#')[1];
		} else {
			return null;
		}

		// Remove leading # if present
		if (hash.startsWith('#')) {
			hash = hash.slice(1);
		}

		// Look for config parameter
		const params = new URLSearchParams(hash);
		const configParam = params.get('config');

		if (!configParam) {
			return null;
		}

		return decodeConfig(configParam);
	} catch (error) {
		console.warn('Failed to parse share URL:', error);
		return null;
	}
}

/**
 * Gets estimated URL length for a settings object
 * Useful for warning about overly long URLs
 * @param settings - Settings to check
 * @param baseUrl - Optional base URL
 * @returns Estimated URL length
 */
export function getEstimatedUrlLength(settings: SettingsObject, baseUrl?: string): number {
	try {
		return generateShareUrl(settings, baseUrl).length;
	} catch (error) {
		return 0;
	}
}

/**
 * Checks if URL is likely to be too long for some browsers/systems
 * Most browsers support URLs up to 2048 characters, but some systems have lower limits
 * @param urlLength - Length to check
 * @returns Warning level: 'ok' | 'warning' | 'error'
 */
export function checkUrlLength(urlLength: number): 'ok' | 'warning' | 'error' {
	if (urlLength < 1800) return 'ok';
	if (urlLength < 2048) return 'warning';
	return 'error';
}

/**
 * Compresses settings by removing default values before encoding
 * This helps reduce URL length for sharing
 * @param settings - Settings to compress
 * @param defaults - Default settings to compare against
 * @returns Compressed settings (delta only)
 */
export async function compressSettings(
	settings: SettingsObject,
	defaults: SettingsObject
): Promise<SettingsObject> {
	// This will use the existing diff function to get only changed values
	const { diff } = await import('./diff.js');
	return diff(settings, defaults);
}
