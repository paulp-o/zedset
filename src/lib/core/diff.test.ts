import { describe, it, expect } from 'vitest';
import { diff, detailedDiff, getChangedPaths, hasChanges } from './diff.js';

describe('diff', () => {
	it('should return only changed fields', () => {
		const defaults = { theme: 'light', fontSize: 14, wordWrap: true };
		const effective = { theme: 'dark', fontSize: 14, wordWrap: false };

		const result = diff(effective, defaults);

		expect(result).toEqual({
			theme: 'dark',
			wordWrap: false
		});
	});

	it('should handle nested objects', () => {
		const defaults = {
			ui: { theme: 'light', fontSize: 14 },
			editor: { wordWrap: true, indent: 2 }
		};
		const effective = {
			ui: { theme: 'dark', fontSize: 14 },
			editor: { wordWrap: true, indent: 4 }
		};

		const result = diff(effective, defaults);

		expect(result).toEqual({
			ui: { theme: 'dark', fontSize: 14 },
			editor: { wordWrap: true, indent: 4 }
		});
	});

	it('should handle arrays', () => {
		const defaults = { languages: ['js', 'ts'] };
		const effective = { languages: ['rust', 'go'] };

		const result = diff(effective, defaults);

		expect(result).toEqual({
			languages: ['rust', 'go']
		});
	});

	it('should handle new keys in effective', () => {
		const defaults = { theme: 'light' };
		const effective = { theme: 'light', newSetting: 'value' };

		const result = diff(effective, defaults);

		expect(result).toEqual({
			newSetting: 'value'
		});
	});

	it('should return empty object when no changes', () => {
		const defaults = { theme: 'light', fontSize: 14 };
		const effective = { theme: 'light', fontSize: 14 };

		const result = diff(effective, defaults);

		expect(result).toEqual({});
	});

	it('should handle null and undefined values', () => {
		const defaults = { a: 'value', b: null, c: undefined };
		const effective = { a: null, b: 'value', c: 'defined' };

		const result = diff(effective, defaults);

		expect(result).toEqual({
			a: null,
			b: 'value',
			c: 'defined'
		});
	});

	it('should handle empty inputs', () => {
		expect(diff({}, {})).toEqual({});
		expect(diff({ a: 1 }, {})).toEqual({ a: 1 });
		expect(diff({}, { b: 2 })).toEqual({});
	});
});

describe('detailedDiff', () => {
	it('should categorize changes correctly', () => {
		const defaults = { theme: 'light', fontSize: 14, oldSetting: 'remove' };
		const effective = { theme: 'dark', fontSize: 14, newSetting: 'add' };

		const result = detailedDiff(effective, defaults);

		expect(result.added).toEqual(['newSetting']);
		expect(result.modified).toEqual(['theme']);
		expect(result.removed).toEqual(['oldSetting']);
		expect(result.delta).toEqual({
			theme: 'dark',
			newSetting: 'add'
		});
	});

	it('should handle empty inputs', () => {
		const result = detailedDiff({}, {});

		expect(result).toEqual({
			added: [],
			modified: [],
			removed: [],
			delta: {}
		});
	});
});

describe('getChangedPaths', () => {
	it('should return changed JSON pointers', () => {
		const defaults = {
			theme: 'light',
			ui: { fontSize: 14, colors: { bg: 'white' } }
		};
		const effective = {
			theme: 'dark',
			ui: { fontSize: 16, colors: { bg: 'white' } }
		};

		const result = getChangedPaths(effective, defaults);

		expect(result).toEqual(new Set(['/theme', '/ui', '/ui/fontSize']));
	});

	it('should handle nested changes', () => {
		const defaults = { a: { b: { c: 1, d: 2 } } };
		const effective = { a: { b: { c: 2, d: 2 } } };

		const result = getChangedPaths(effective, defaults);

		expect(result).toEqual(new Set(['/a', '/a/b', '/a/b/c']));
	});

	it('should handle new and removed keys', () => {
		const defaults = { old: 'value', shared: 'same' };
		const effective = { new: 'value', shared: 'same' };

		const result = getChangedPaths(effective, defaults);

		expect(result).toEqual(new Set(['/new', '/old']));
	});
});

describe('hasChanges', () => {
	it('should return true when there are changes', () => {
		const defaults = { theme: 'light' };
		const effective = { theme: 'dark' };

		expect(hasChanges(effective, defaults)).toBe(true);
	});

	it('should return false when there are no changes', () => {
		const defaults = { theme: 'light', fontSize: 14 };
		const effective = { theme: 'light', fontSize: 14 };

		expect(hasChanges(effective, defaults)).toBe(false);
	});

	it('should handle empty objects', () => {
		expect(hasChanges({}, {})).toBe(false);
		expect(hasChanges({ a: 1 }, {})).toBe(true);
		expect(hasChanges({}, { a: 1 })).toBe(false);
	});
});
