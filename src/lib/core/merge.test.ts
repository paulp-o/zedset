import { describe, it, expect } from 'vitest';
import { merge, shallowMerge, mergeMultiple } from './merge.js';

describe('merge', () => {
	it('should merge simple objects', () => {
		const defaults = { theme: 'light', fontSize: 14 };
		const user = { theme: 'dark' };

		const result = merge(defaults, user);

		expect(result).toEqual({
			theme: 'dark',
			fontSize: 14
		});
	});

	it('should handle nested objects', () => {
		const defaults = {
			ui: { theme: 'light', fontSize: 14 },
			editor: { wordWrap: true }
		};
		const user = {
			ui: { theme: 'dark' }
		};

		const result = merge(defaults, user);

		expect(result).toEqual({
			ui: { theme: 'dark', fontSize: 14 },
			editor: { wordWrap: true }
		});
	});

	it('should replace arrays entirely', () => {
		const defaults = {
			languages: ['javascript', 'typescript'],
			settings: { theme: 'light' }
		};
		const user = {
			languages: ['rust', 'go']
		};

		const result = merge(defaults, user);

		expect(result).toEqual({
			languages: ['rust', 'go'],
			settings: { theme: 'light' }
		});
	});

	it('should handle null and undefined values', () => {
		const defaults = { a: 'default', b: 'keep', c: null };
		const user = { a: null, c: 'override' };

		const result = merge(defaults, user);

		expect(result).toEqual({
			a: null,
			b: 'keep',
			c: 'override'
		});
	});

	it('should handle empty inputs', () => {
		expect(merge({}, {})).toEqual({});
		expect(merge({ a: 1 }, {})).toEqual({ a: 1 });
		expect(merge({}, { b: 2 })).toEqual({ b: 2 });
	});

	it('should handle null/undefined inputs', () => {
		expect(merge(null as any, null as any)).toEqual({});
		expect(merge({ a: 1 }, null as any)).toEqual({ a: 1 });
		expect(merge(null as any, { b: 2 })).toEqual({ b: 2 });
	});

	it('should deeply clone values to avoid mutations', () => {
		const defaults = { nested: { value: 1 } };
		const user = { nested: { value: 2 } };

		const result = merge(defaults, user);

		// Mutate original
		defaults.nested.value = 999;
		user.nested.value = 888;

		// Result should be unchanged
		expect((result.nested as any).value).toBe(2);
	});

	it('should handle user keys not in defaults', () => {
		const defaults = { a: 1 };
		const user = { b: 2, c: 3 };

		const result = merge(defaults, user);

		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});
});

describe('shallowMerge', () => {
	it('should only merge top-level properties', () => {
		const defaults = {
			ui: { theme: 'light', fontSize: 14 },
			editor: { wordWrap: true }
		};
		const user = {
			ui: { theme: 'dark' }
		};

		const result = shallowMerge(defaults, user);

		expect(result).toEqual({
			ui: { theme: 'dark' }, // Only user's ui object, not merged
			editor: { wordWrap: true }
		});
	});
});

describe('mergeMultiple', () => {
	it('should merge multiple objects in order', () => {
		const obj1 = { a: 1, b: 2 };
		const obj2 = { b: 3, c: 4 };
		const obj3 = { c: 5, d: 6 };

		const result = mergeMultiple(obj1, obj2, obj3);

		expect(result).toEqual({
			a: 1,
			b: 3,
			c: 5,
			d: 6
		});
	});

	it('should handle empty array', () => {
		const result = mergeMultiple();
		expect(result).toEqual({});
	});

	it('should handle null/undefined in array', () => {
		const result = mergeMultiple({ a: 1 }, null as any, { b: 2 });
		expect(result).toEqual({ a: 1, b: 2 });
	});
});
