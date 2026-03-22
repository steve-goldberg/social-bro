import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatNumber(num: number | undefined): string {
	if (num === undefined || num === null) return '—';
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}
	return num.toLocaleString();
}

export function calculateEngagement(views: number, likes: number, comments: number): number {
	if (!views || views === 0) return 0;
	return ((likes + comments) / views) * 100;
}

export function decodeHtmlEntities(text: string): string {
	if (!text) return text;

	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&#x27;': "'",
		'&apos;': "'",
		'&#x2F;': '/',
		'&nbsp;': ' '
	};

	let decoded = text;
	for (const [entity, char] of Object.entries(entities)) {
		decoded = decoded.replaceAll(entity, char);
	}

	decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
	decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
		String.fromCharCode(parseInt(hex, 16))
	);

	return decoded;
}
