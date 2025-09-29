import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally apply and merge Tailwind CSS classes.
 * Combines clsx for conditional logic and tailwind-merge for proper class merging.
 *
 * @param inputs - Class values (strings, objects, arrays, etc.)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

// Types for shadcn-svelte components
export type DOMElement = Element;

export type WithElementRef<T> = T & {
	ref?: HTMLElement | null | undefined;
};

export type WithoutChildren<T> = Omit<T, 'children'>;

export type WithoutChild<T> = Omit<T, 'child'>;

export type WithAsChild<T> = T & {
	asChild?: boolean;
};

export type WithChild<T> = T & {
	child?: unknown;
};

export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

export type EventHandler<T extends Event = Event, U extends DOMElement = DOMElement> = (
	event: T & { currentTarget: U }
) => void;
