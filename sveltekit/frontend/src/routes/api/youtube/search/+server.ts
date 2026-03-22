import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { searchYouTube } from '$lib/youtube';
import { requireUserId } from '$lib/auth-utils';
import { isApiError } from '$lib/errors';
import { getTrailBaseClient } from '$lib/trailbase';

// Helper to calculate publishedAfter date from dateRange
function getPublishedAfterDate(dateRange: string): string | undefined {
	if (dateRange === 'any') return undefined;

	const now = new Date();
	let date: Date;

	switch (dateRange) {
		case 'day':
			date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			break;
		case 'week':
			date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'month':
			date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		default:
			return undefined;
	}

	return date.toISOString();
}

export async function GET(event: RequestEvent) {
	const query = event.url.searchParams.get('q');
	const type = event.url.searchParams.get('type') as 'video' | 'channel' | 'playlist' | null;

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		// Fetch user-specific config from database
		const defaultConfig = {
			maxResults: 25,
			dateRange: 'any',
			region: 'US',
			videoDuration: 'any',
			order: 'relevance'
		};

		let config = defaultConfig;

		try {
			const client = getTrailBaseClient();
			const records = await client.records('youtube_configs').list({
				filters: `user_id = '${userId}'`,
				pageSize: 1
			});
			if (records.length > 0) {
				const dbConfig = records[0];
				config = {
					maxResults: dbConfig.maxResults ?? defaultConfig.maxResults,
					dateRange: dbConfig.dateRange ?? defaultConfig.dateRange,
					region: dbConfig.region ?? defaultConfig.region,
					videoDuration: dbConfig.videoDuration ?? defaultConfig.videoDuration,
					order: dbConfig.order ?? defaultConfig.order
				};
			}
		} catch (dbError) {
			console.error('Failed to fetch YouTube config from database:', dbError);
			// Use defaults if config fetch fails
		}

		const results = await searchYouTube({
			userId,
			query,
			maxResults: config.maxResults,
			order: config.order as 'date' | 'rating' | 'relevance' | 'title' | 'viewCount',
			type: type || 'video',
			regionCode: config.region,
			publishedAfter: getPublishedAfterDate(config.dateRange),
			videoDuration: config.videoDuration as 'any' | 'short' | 'medium' | 'long'
		});

		return json({ results });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('YouTube search error:', error);
		return json({ error: 'Failed to search YouTube' }, { status: 500 });
	}
}
