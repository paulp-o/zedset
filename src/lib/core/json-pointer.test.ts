import { describe, it, expect } from 'vitest';
import {
	parsePointer,
	createPointer,
	getByPointer,
	setByPointer,
	removeByPointer,
	hasPointer,
	getParentPointer,
	getPointerProperty,
	isValidPointer
} from './json-pointer.js';

describe('parsePointer', () => {
	it('should parse simple pointers', () => {
		expect(parsePointer('/theme')).toEqual(['theme']);
		expect(parsePointer('/ui/fontSize')).toEqual(['ui', 'fontSize']);
		expect(parsePointer('/a/b/c')).toEqual(['a', 'b', 'c']);
	});

	it('should handle root pointer', () => {
		expect(parsePointer('')).toEqual([]);
		expect(parsePointer('/')).toEqual(['']);
	});

	it('should handle escaped characters', () => {
		expect(parsePointer('/foo~1bar')).toEqual(['foo/bar']);
		expect(parsePointer('/foo~0bar')).toEqual(['foo~bar']);
		expect(parsePointer('/foo~01bar')).toEqual(['foo~1bar']);
	});

	it('should handle pointers without leading slash', () => {
		expect(parsePointer('theme')).toEqual(['theme']);
		expect(parsePointer('ui/fontSize')).toEqual(['ui', 'fontSize']);
	});
});

describe('createPointer', () => {
	it('should create pointers from components', () => {
		expect(createPointer(['theme'])).toBe('/theme');
		expect(createPointer(['ui', 'fontSize'])).toBe('/ui/fontSize');
		expect(createPointer(['a', 'b', 'c'])).toBe('/a/b/c');
	});

	it('should handle empty array', () => {
		expect(createPointer([])).toBe('');
	});

	it('should escape special characters', () => {
		expect(createPointer(['foo/bar'])).toBe('/foo~1bar');
		expect(createPointer(['foo~bar'])).toBe('/foo~0bar');
		expect(createPointer(['foo~1bar'])).toBe('/foo~01bar');
	});
});

describe('getByPointer', () => {
	const testObj = {
		theme: 'dark',
		ui: {
			fontSize: 14,
			colors: {
				bg: 'white',
				fg: 'black'
			}
		},
		features: ['vim', 'copilot'],
		nullValue: null,
		zeroValue: 0,
		falseValue: false
	};

	it('should get simple values', () => {
		expect(getByPointer(testObj, '/theme')).toBe('dark');
		expect(getByPointer(testObj, '/nullValue')).toBe(null);
		expect(getByPointer(testObj, '/zeroValue')).toBe(0);
		expect(getByPointer(testObj, '/falseValue')).toBe(false);
	});

	it('should get nested values', () => {
		expect(getByPointer(testObj, '/ui/fontSize')).toBe(14);
		expect(getByPointer(testObj, '/ui/colors/bg')).toBe('white');
	});

	it('should get array values', () => {
		expect(getByPointer(testObj, '/features/0')).toBe('vim');
		expect(getByPointer(testObj, '/features/1')).toBe('copilot');
	});

	it('should return undefined for missing paths', () => {
		expect(getByPointer(testObj, '/nonexistent')).toBeUndefined();
		expect(getByPointer(testObj, '/ui/nonexistent')).toBeUndefined();
		expect(getByPointer(testObj, '/features/99')).toBeUndefined();
	});

	it('should handle empty inputs', () => {
		expect(getByPointer({}, '/theme')).toBeUndefined();
		expect(getByPointer(testObj, '')).toBe(testObj);
		expect(getByPointer(null as any, '/theme')).toBeUndefined();
	});
});

describe('setByPointer', () => {
	it('should set simple values', () => {
		const obj = { theme: 'light' };
		const result = setByPointer(obj, '/theme', 'dark');

		expect(result).toEqual({ theme: 'dark' });
		expect(obj.theme).toBe('light'); // Original unchanged
	});

	it('should set nested values', () => {
		const obj = { ui: { fontSize: 12 } };
		const result = setByPointer(obj, '/ui/fontSize', 16);

		expect(result).toEqual({ ui: { fontSize: 16 } });
	});

	it('should create intermediate objects', () => {
		const obj = {};
		const result = setByPointer(obj, '/ui/colors/bg', 'white');

		expect(result).toEqual({
			ui: {
				colors: {
					bg: 'white'
				}
			}
		});
	});

	it('should create intermediate arrays', () => {
		const obj = {};
		const result = setByPointer(obj, '/features/0', 'vim');

		expect(result).toEqual({
			features: ['vim']
		});
	});

	it('should handle existing arrays', () => {
		const obj = { features: ['vim'] };
		const result = setByPointer(obj, '/features/1', 'copilot');

		expect(result).toEqual({
			features: ['vim', 'copilot']
		});
	});

	it('should handle empty pointer', () => {
		const obj = { theme: 'light' };
		const result = setByPointer(obj, '', 'new');

		expect(result).toBe(obj); // Should return original
	});
});

describe('removeByPointer', () => {
	it('should remove simple properties', () => {
		const obj = { theme: 'dark', fontSize: 14 };
		const result = removeByPointer(obj, '/theme');

		expect(result).toEqual({ fontSize: 14 });
		expect(obj.theme).toBe('dark'); // Original unchanged
	});

	it('should remove nested properties', () => {
		const obj = { ui: { theme: 'dark', fontSize: 14 } };
		const result = removeByPointer(obj, '/ui/theme');

		expect(result).toEqual({ ui: { fontSize: 14 } });
	});

	it('should remove array elements', () => {
		const obj = { features: ['vim', 'copilot', 'git'] };
		const result = removeByPointer(obj, '/features/1');

		expect(result).toEqual({ features: ['vim', 'git'] });
	});

	it('should handle missing paths gracefully', () => {
		const obj = { theme: 'dark' };
		const result = removeByPointer(obj, '/nonexistent');

		expect(result).toEqual({ theme: 'dark' });
	});
});

describe('hasPointer', () => {
	const testObj = {
		theme: 'dark',
		ui: { fontSize: 14 },
		nullValue: null,
		zeroValue: 0,
		falseValue: false
	};

	it('should return true for existing paths', () => {
		expect(hasPointer(testObj, '/theme')).toBe(true);
		expect(hasPointer(testObj, '/ui/fontSize')).toBe(true);
		expect(hasPointer(testObj, '/nullValue')).toBe(true);
		expect(hasPointer(testObj, '/zeroValue')).toBe(true);
		expect(hasPointer(testObj, '/falseValue')).toBe(true);
	});

	it('should return false for missing paths', () => {
		expect(hasPointer(testObj, '/nonexistent')).toBe(false);
		expect(hasPointer(testObj, '/ui/nonexistent')).toBe(false);
	});
});

describe('getParentPointer', () => {
	it('should return parent pointers', () => {
		expect(getParentPointer('/ui/fontSize')).toBe('/ui');
		expect(getParentPointer('/a/b/c')).toBe('/a/b');
		expect(getParentPointer('/theme')).toBe('');
		expect(getParentPointer('')).toBe('');
	});
});

describe('getPointerProperty', () => {
	it('should return the last component', () => {
		expect(getPointerProperty('/ui/fontSize')).toBe('fontSize');
		expect(getPointerProperty('/theme')).toBe('theme');
		expect(getPointerProperty('')).toBe('');
		expect(getPointerProperty('/a/b/c')).toBe('c');
	});
});

describe('isValidPointer', () => {
	it('should validate correct pointers', () => {
		expect(isValidPointer('')).toBe(true);
		expect(isValidPointer('/theme')).toBe(true);
		expect(isValidPointer('/ui/fontSize')).toBe(true);
		expect(isValidPointer('/foo~1bar')).toBe(true);
		expect(isValidPointer('/foo~0bar')).toBe(true);
	});

	it('should reject invalid pointers', () => {
		expect(isValidPointer('theme')).toBe(false); // Missing leading slash
		expect(isValidPointer(123 as any)).toBe(false); // Not a string
		expect(isValidPointer(null as any)).toBe(false); // Not a string
	});
});
