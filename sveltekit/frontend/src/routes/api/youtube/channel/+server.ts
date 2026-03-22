import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getChannelVideosByUsername, getMultipleVideoDetails } from '$lib/youtube';
import { requireUserId } from '$lib/auth-utils';
import { isApiError } from '$lib/errors';
import { getTrailBaseClient } from '$lib/trailbase';

export async function GET(event: RequestEvent) {
	const username = event.url.searchParams.get('username');

	if (!username) {
		return json({ error: 'Username parameter is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		// Fetch config from database
		let maxResults = 25;
		try {
			const client = getTrailBaseClient();
			const records = await client.records('youtube_configs').list({
				filters: `user_id = '${userId}'`,
				pageSize: 1
			});
			if (records.length > 0) {
				maxResults = records[0].maxResults ?? 25;
			}
		} catch (dbError) {
			console.error('Failed to fetch YouTube config:', dbError);
			// Use default if config fetch fails
		}

		const { channel, videos } = await getChannelVideosByUsername(userId, username, maxResults);

		if (!channel) {
			return json({ error: 'Channel not found' }, { status: 404 });
		}

		// Get video IDs to fetch detailed stats
		const videoIds = videos.map((v) => v.id).filter(Boolean);

		// Fetch video details with stats
		const videoDetails = videoIds.length > 0 ? await getMultipleVideoDetails(userId, videoIds) : [];

		return json({
			channel,
			videos,
			videoDetails
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('Error fetching channel videos:', error);
		return json({ error: 'Failed to fetch channel videos' }, { status: 500 });
	}
}
