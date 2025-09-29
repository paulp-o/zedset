// Data merging and diffing
export { merge, shallowMerge, mergeMultiple } from './merge.js';
export {
	diff,
	detailedDiff,
	getChangedPaths,
	hasChanges,
	type DetailedDiffResult
} from './diff.js';

// JSON Pointer utilities
export {
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

// Validation and schema utilities
export {
	validateSettings,
	extractWidgetHints,
	getFieldWidgetHints,
	validateField,
	isValidSchema
} from './validator.js';
