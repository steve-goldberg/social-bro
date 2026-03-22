import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchInstagram, getUserReels, transformReelsToTableData } from '$lib/rapidapi';
import { requireUserId } from '$lib/auth-utils';
import { isApiError } from '$lib/errors';

export const GET: RequestHandler = async (event) => {
	const username = event.url.searchParams.get('username');

	if (!username) {
		return json({ error: 'Query parameter "username" is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		// Search for the user to get their pk
		const users = await searchInstagram({
			userId,
			query: username
		});

		// Find exact username match or closest match
		const user =
			users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || users[0];

		if (!user) {
			return json({ error: `User @${username} not found` }, { status: 404 });
		}

		// Fetch user's reels
		const reels = await getUserReels({
			userId,
			userPk: user.pk,
			count: 12
		});

		// Add username to reels if missing
		const reelsWithUser = reels.map((reel) => ({
			...reel,
			username: reel.username || user.username
		}));

		const tableData = transformReelsToTableData(reelsWithUser);

		return json({
			user,
			results: tableData
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('Instagram user lookup error:', error);
		return json({ error: 'Failed to fetch Instagram user' }, { status: 500 });
	}
};
