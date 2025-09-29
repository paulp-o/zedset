import { describe, it, expect } from 'vitest';
import { loadLiveDefaultSettings, ZED_DEFAULT_SETTINGS_URL } from './jsonc-parser.js';

describe('Live fetching integration test', () => {
	it('should be able to fetch real Zed default settings', async () => {
		// This test actually hits the network - skip if you want to avoid network calls in tests
		// Use loadLiveDefaultSettings to force fetching from GitHub regardless of environment
		const result = await loadLiveDefaultSettings();

		// The result should have some value and docs
		expect(typeof result.value).toBe('object');
		expect(result.value).not.toEqual({});

		// Should have some documentation
		expect(typeof result.docs).toBe('object');

		// Should not have errors (unless network is down)
		if (result.errors.length > 0) {
			console.warn('Network fetch failed (this is okay if offline):', result.errors);
		}

		console.log('Fetched settings keys:', Object.keys(result.value).slice(0, 5));
		console.log('Documentation entries:', Object.keys(result.docs).length);
	}, 10000); // 10 second timeout for network request

	it('should use the correct URL', () => {
		expect(ZED_DEFAULT_SETTINGS_URL).toBe(
			'https://raw.githubusercontent.com/zed-industries/zed/refs/heads/main/assets/settings/default.json'
		);
	});
});
