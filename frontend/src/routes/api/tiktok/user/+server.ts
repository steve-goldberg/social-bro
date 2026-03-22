import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserPosts, transformUserPostsToTableData } from '$lib/rapidapi';
import { requireUserId } from '$lib/auth-utils';

export const GET: RequestHandler = async (event) => {
	const secUid = event.url.searchParams.get('secUid');

	if (!secUid) {
		return json({ error: 'Query parameter "secUid" is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		const posts = await getUserPosts({
			userId,
			secUid
		});

		const tableData = transformUserPostsToTableData(posts);

		return json({ results: tableData });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (error instanceof Error && error.message.includes('RapidAPI key not configured')) {
			return json({ error: 'RapidAPI key not configured' }, { status: 400 });
		}
		console.error('TikTok user posts error:', error);
		return json({ error: 'Failed to fetch TikTok user posts' }, { status: 500 });
	}
};
