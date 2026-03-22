import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserInfo, getUserPosts, transformUserPostsToTableData } from '$lib/rapidapi';
import { requireUserId } from '$lib/auth-utils';
import { isApiError } from '$lib/errors';

export const GET: RequestHandler = async (event) => {
	const username = event.url.searchParams.get('username');

	if (!username) {
		return json({ error: 'Query parameter "username" is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		// First, get user info to get secUid
		const userInfo = await getUserInfo(userId, username);

		if (!userInfo) {
			return json({ error: `User @${username} not found` }, { status: 404 });
		}

		// Then, fetch user's posts using secUid
		const posts = await getUserPosts({
			userId,
			secUid: userInfo.secUid
		});

		const tableData = transformUserPostsToTableData(posts);

		return json({
			user: userInfo,
			results: tableData
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('TikTok user lookup error:', error);
		return json({ error: 'Failed to fetch TikTok user' }, { status: 500 });
	}
};
