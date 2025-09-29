import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	parseJsoncWithDocs,
	fetchDefaultSettings,
	fetchLiveDefaultSettings,
	loadDefaultSettings,
	loadLiveDefaultSettings,
	ZED_DEFAULT_SETTINGS_URL,
	LOCAL_DEFAULT_SETTINGS_PATH
} from './jsonc-parser.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('parseJsoncWithDocs', () => {
	it('should parse valid JSONC with comments', () => {
		const jsonc = `{
  // This is the theme setting
  "theme": "dark",
  /* Font size for the buffer */
  "buffer_font_size": 16,
  "ui_font_size": 14
}`;

		const result = parseJsoncWithDocs(jsonc);

		expect(result.value).toEqual({
			theme: 'dark',
			buffer_font_size: 16,
			ui_font_size: 14
		});

		expect(result.docs['/theme']).toBe('This is the theme setting');
		expect(result.docs['/buffer_font_size']).toBe('Font size for the buffer');
		expect(result.errors).toHaveLength(0);
	});

	it('should handle JSONC without comments', () => {
		const jsonc = `{
  "theme": "light",
  "buffer_font_size": 14
}`;

		const result = parseJsoncWithDocs(jsonc);

		expect(result.value).toEqual({
			theme: 'light',
			buffer_font_size: 14
		});

		expect(Object.keys(result.docs)).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	it('should handle invalid JSON gracefully', () => {
		const jsonc = `{
  "theme": "dark",
  "invalid": [unclosed array
}`;

		const result = parseJsoncWithDocs(jsonc);

		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0]).toContain('Parse error');
	});

	it('should handle empty input', () => {
		const result = parseJsoncWithDocs('');

		expect(result.value).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain('No valid JSON tree found');
	});
});

describe('fetchDefaultSettings', () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it('should fetch settings successfully', async () => {
		const mockJsonc = '{"theme": "dark"}';
		mockFetch.mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(mockJsonc)
		});

		const result = await fetchDefaultSettings();

		// In test environment, it should use the appropriate URL based on dev mode
		expect(mockFetch).toHaveBeenCalled();
		expect(result).toBe(mockJsonc);
	});

	it('should use local path in development', () => {
		// Test that we have the local path constant
		expect(LOCAL_DEFAULT_SETTINGS_PATH).toBe('/default.settings.jsonc');
	});

	it('should handle network errors', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		await expect(fetchDefaultSettings()).rejects.toThrow('Error fetching default settings');
	});

	it('should handle HTTP errors', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: 'Not Found'
		});

		await expect(fetchDefaultSettings()).rejects.toThrow(
			'Failed to fetch default settings: 404 Not Found'
		);
	});

	it('should handle empty response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('  ')
		});

		await expect(fetchDefaultSettings()).rejects.toThrow('Default settings file is empty');
	});
});

describe('fetchLiveDefaultSettings', () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it('should always fetch from GitHub URL', async () => {
		const mockJsonc = '{"theme": "dark"}';
		mockFetch.mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(mockJsonc)
		});

		const result = await fetchLiveDefaultSettings();

		expect(mockFetch).toHaveBeenCalledWith(ZED_DEFAULT_SETTINGS_URL);
		expect(result).toBe(mockJsonc);
	});

	it('should handle network errors', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		await expect(fetchLiveDefaultSettings()).rejects.toThrow(
			'Network error fetching live default settings'
		);
	});
});

describe('loadDefaultSettings', () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it('should load and parse settings successfully', async () => {
		const mockJsonc = `{
  // Theme setting
  "theme": "dark"
}`;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(mockJsonc)
		});

		const result = await loadDefaultSettings();

		expect(result.value).toEqual({ theme: 'dark' });
		expect(result.docs['/theme']).toBe('Theme setting');
		expect(result.errors).toHaveLength(0);
	});

	it('should handle fetch errors gracefully', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const result = await loadDefaultSettings();

		expect(result.value).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain('Error fetching default settings');
	});
});

describe('loadLiveDefaultSettings', () => {
	beforeEach(() => {
		mockFetch.mockClear();
	});

	it('should load and parse live settings successfully', async () => {
		const mockJsonc = `{
  // Theme setting
  "theme": "dark"
}`;
		mockFetch.mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(mockJsonc)
		});

		const result = await loadLiveDefaultSettings();

		expect(mockFetch).toHaveBeenCalledWith(ZED_DEFAULT_SETTINGS_URL);
		expect(result.value).toEqual({ theme: 'dark' });
		expect(result.docs['/theme']).toBe('Theme setting');
		expect(result.errors).toHaveLength(0);
	});

	it('should handle fetch errors gracefully', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const result = await loadLiveDefaultSettings();

		expect(result.value).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toContain('Network error fetching live default settings');
	});
});
