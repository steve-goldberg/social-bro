import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function calculateEngagement(
  views: number,
  likes: number,
  comments: number
): number {
  if (!views || views === 0) return 0;
  return ((likes + comments) / views) * 100;
}
