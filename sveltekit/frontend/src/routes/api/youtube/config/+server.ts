import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';

export interface YouTubeConfigData {
	maxResults: number;
	dateRange: string;
	region: string;
	videoDuration: string;
	order: string;
}

const DEFAULT_CONFIG: YouTubeConfigData = {
	maxResults: 25,
	dateRange: 'any',
	region: 'US',
	videoDuration: 'any',
	order: 'relevance'
};

// GET - Fetch YouTube config for current user
export async function GET(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const client = getTrailBaseClient();
		const records = await client.records('youtube_configs').list({
			filters: `user_id = '${userId}'`,
			pageSize: 1
		});

		if (records.length === 0) {
			return json(DEFAULT_CONFIG);
		}

		const config = records[0];
		return json({
			maxResults: config.maxResults,
			dateRange: config.dateRange,
			region: config.region,
			videoDuration: config.videoDuration,
			order: config.order
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Failed to fetch YouTube config:', error);
		return json(DEFAULT_CONFIG);
	}
}

// POST - Save YouTube config for current user
export async function POST(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { maxResults, dateRange, region, videoDuration, order } = body;

		// Validate inputs
		const validMaxResults = Math.min(Math.max(Number(maxResults) || 25, 1), 50);
		const validDateRange = ['any', 'day', 'week', 'month'].includes(dateRange)
			? dateRange
			: 'any';
		// Validate region code (ISO 3166-1 alpha-2)
		const validRegionCodes = [
			'US',
			'GB',
			'CA',
			'AU',
			'DE',
			'FR',
			'JP',
			'KR',
			'IN',
			'BR',
			'MX',
			'ES',
			'IT',
			'NL',
			'RU',
			'PL',
			'SE',
			'NO',
			'DK',
			'FI',
			'AT',
			'CH',
			'BE',
			'PT',
			'IE',
			'NZ',
			'SG',
			'HK',
			'TW',
			'PH',
			'ID',
			'MY',
			'TH',
			'VN',
			'ZA',
			'AR',
			'CL',
			'CO',
			'PE',
			'EG',
			'SA',
			'AE',
			'IL',
			'TR',
			'UA'
		];
		const validRegion =
			typeof region === 'string' && validRegionCodes.includes(region.toUpperCase())
				? region.toUpperCase()
				: 'US';
		const validDuration = ['any', 'short', 'medium', 'long'].includes(videoDuration)
			? videoDuration
			: 'any';
		const validOrder = ['date', 'rating', 'relevance', 'title', 'viewCount'].includes(order)
			? order
			: 'relevance';

		const client = getTrailBaseClient();

		// Check if config exists for this user
		const existing = await client.records('youtube_configs').list({
			filters: `user_id = '${userId}'`,
			pageSize: 1
		});

		const configData = {
			user_id: userId,
			maxResults: validMaxResults,
			dateRange: validDateRange,
			region: validRegion,
			videoDuration: validDuration,
			order: validOrder
		};

		let config;
		if (existing.length > 0) {
			// Update existing
			config = await client.records('youtube_configs').update(existing[0].id, configData);
		} else {
			// Create new
			config = await client.records('youtube_configs').create(configData);
		}

		return json({
			maxResults: config.maxResults ?? validMaxResults,
			dateRange: config.dateRange ?? validDateRange,
			region: config.region ?? validRegion,
			videoDuration: config.videoDuration ?? validDuration,
			order: config.order ?? validOrder
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'Unauthorized') {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
			if (error.message === 'InvalidSession') {
				return json(
					{ error: 'Session invalid. Please log out and log in again.' },
					{ status: 401 }
				);
			}
		}
		console.error('Failed to save YouTube config:', error);
		return json({ error: 'Failed to save configuration' }, { status: 500 });
	}
}
