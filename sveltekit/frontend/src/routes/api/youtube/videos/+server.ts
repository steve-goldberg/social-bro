import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getMultipleVideoDetails } from '$lib/youtube';
import { requireUserId } from '$lib/auth-utils';

export async function GET(event: RequestEvent) {
	const ids = event.url.searchParams.get('ids');

	if (!ids) {
		return json({ error: 'Video IDs are required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		// YouTube video IDs are 11 characters, alphanumeric with - and _
		const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
		const videoIds = ids
			.split(',')
			.filter(Boolean)
			.filter((id) => videoIdPattern.test(id));

		if (videoIds.length === 0) {
			return json({ error: 'No valid video IDs provided' }, { status: 400 });
		}

		if (videoIds.length > 50) {
			return json({ error: 'Maximum 50 video IDs per request' }, { status: 400 });
		}

		const videos = await getMultipleVideoDetails(userId, videoIds);
		return json({ videos });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('YouTube video details error:', error);
		return json({ error: 'Failed to fetch video details' }, { status: 500 });
	}
}
