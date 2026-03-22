import type { Platform, YouTubeTableData, TikTokTableData, InstagramTableData } from '$lib/types';
import type { YouTubeSearchResult, YouTubeVideoDetails, YouTubeChannelDetails } from '$lib/youtube';
import { calculateEngagement } from '$lib/utils';

export interface ChannelVideosResponse {
	channel: YouTubeChannelDetails;
	videos: YouTubeSearchResult[];
	videoDetails: YouTubeVideoDetails[];
}

export interface SearchResponse {
	results: YouTubeSearchResult[];
}

export async function searchPlatform(
	platform: Platform,
	query: string
): Promise<SearchResponse> {
	switch (platform) {
		case 'youtube': {
			const response = await fetch(
				`/api/youtube/search?q=${encodeURIComponent(query)}&type=video`
			);
			if (!response.ok) {
				throw new Error('Failed to search YouTube');
			}
			return response.json();
		}
		case 'instagram':
		case 'tiktok':
			return { results: [] };
		default:
			return { results: [] };
	}
}

/**
 * Fetch videos from a specific TikTok user by username
 */
export async function getTikTokUserVideos(username: string): Promise<TikTokTableData[]> {
	const response = await fetch(
		`/api/tiktok/user/username?username=${encodeURIComponent(username)}`
	);

	if (!response.ok) {
		if (response.status === 404) {
			return [];
		}
		const error = await response.json().catch(() => ({ error: 'Failed to fetch TikTok user' }));
		throw new Error(error.error || 'Failed to fetch TikTok user');
	}

	const { results } = await response.json();
	return results || [];
}

/**
 * Search TikTok and return table-ready data
 */
export async function searchTikTokWithDetails(query: string): Promise<TikTokTableData[]> {
	if (isUsernameQuery(query)) {
		const username = extractUsername(query);
		return getTikTokUserVideos(username);
	}

	const response = await fetch(`/api/tiktok/search?q=${encodeURIComponent(query)}`);
	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Failed to search TikTok' }));
		throw new Error(error.error || 'Failed to search TikTok');
	}
	const { results } = await response.json();
	return results || [];
}

export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
	const response = await fetch(`/api/youtube/videos?ids=${videoIds.join(',')}`);
	if (!response.ok) {
		throw new Error('Failed to fetch video details');
	}
	const data = await response.json();
	return data.videos;
}

/**
 * Check if query is a @username pattern
 */
export function isUsernameQuery(query: string): boolean {
	return query.trim().startsWith('@');
}

/**
 * Extract username from @username query
 */
export function extractUsername(query: string): string {
	return query.trim().replace(/^@/, '');
}

/**
 * Fetch videos from a specific YouTube channel by username
 */
export async function getChannelVideosWithDetails(
	username: string
): Promise<YouTubeTableData[]> {
	const response = await fetch(
		`/api/youtube/channel?username=${encodeURIComponent(username)}`
	);

	if (!response.ok) {
		if (response.status === 404) {
			return [];
		}
		throw new Error('Failed to fetch channel videos');
	}

	const { channel, videos, videoDetails } = (await response.json()) as ChannelVideosResponse;

	const detailsMap = new Map(videoDetails.map((d) => [d.id, d]));

	return videos.map((video: YouTubeSearchResult) => {
		const detail = detailsMap.get(video.id);
		const views = parseInt(detail?.viewCount || '0', 10);
		const likes = parseInt(detail?.likeCount || '0', 10);
		const comments = parseInt(detail?.commentCount || '0', 10);

		return {
			id: video.id,
			username: channel.title,
			title: video.title,
			views,
			likes,
			comments,
			engagementScore: calculateEngagement(views, likes, comments),
			url: video.videoUrl,
			thumbnail: channel.thumbnail
		};
	});
}

export async function searchYouTubeWithDetails(query: string): Promise<YouTubeTableData[]> {
	if (isUsernameQuery(query)) {
		const username = extractUsername(query);
		return getChannelVideosWithDetails(username);
	}

	const searchResponse = await fetch(
		`/api/youtube/search?q=${encodeURIComponent(query)}&type=video`
	);
	if (!searchResponse.ok) {
		throw new Error('Failed to search YouTube');
	}
	const { results } = await searchResponse.json();

	if (results.length === 0) return [];

	const videoIds = results.map((r: YouTubeSearchResult) => r.id);
	const details = await getVideoDetails(videoIds);

	const detailsMap = new Map(details.map((d) => [d.id, d]));

	return results.map((result: YouTubeSearchResult) => {
		const detail = detailsMap.get(result.id);
		const views = parseInt(detail?.viewCount || '0', 10);
		const likes = parseInt(detail?.likeCount || '0', 10);
		const comments = parseInt(detail?.commentCount || '0', 10);

		return {
			id: result.id,
			username: result.channelTitle,
			title: result.title,
			views,
			likes,
			comments,
			engagementScore: calculateEngagement(views, likes, comments),
			url: result.videoUrl,
			thumbnail: result.thumbnail
		};
	});
}

/**
 * Fetch reels from a specific Instagram user by username
 */
export async function getInstagramUserReels(username: string): Promise<InstagramTableData[]> {
	const response = await fetch(
		`/api/instagram/user/username?username=${encodeURIComponent(username)}`
	);

	if (!response.ok) {
		if (response.status === 404) {
			return [];
		}
		const error = await response
			.json()
			.catch(() => ({ error: 'Failed to fetch Instagram user' }));
		throw new Error(error.error || 'Failed to fetch Instagram user');
	}

	const { results } = await response.json();
	return results || [];
}

/**
 * Search Instagram and return table-ready data
 */
export async function searchInstagramWithDetails(
	query: string
): Promise<InstagramTableData[]> {
	if (isUsernameQuery(query)) {
		const username = extractUsername(query);
		return getInstagramUserReels(username);
	}

	const response = await fetch(`/api/instagram/search?q=${encodeURIComponent(query)}`);
	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ error: 'Failed to search Instagram' }));
		throw new Error(error.error || 'Failed to search Instagram');
	}
	const { results } = await response.json();
	return results || [];
}
