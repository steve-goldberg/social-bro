import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchInstagram, getUserReels, transformReelsToTableData } from '$lib/rapidapi';
import { requireUserId } from '$lib/auth-utils';
import { isApiError } from '$lib/errors';
import { checkRateLimit, RATE_LIMITS } from '$lib/rate-limit';

export const GET: RequestHandler = async (event) => {
	const query = event.url.searchParams.get('q');

	if (!query) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		const rateLimit = checkRateLimit(`instagram:${userId}`, RATE_LIMITS.search);
		if (!rateLimit.success) {
			return json(
				{ error: 'Rate limit exceeded. Please try again later.' },
				{ status: 429 }
			);
		}

		// Search for users
		const users = await searchInstagram({
			userId,
			query
		});

		if (users.length === 0) {
			return json({ results: [] });
		}

		// Get reels from the first (most relevant) user
		const topUser = users[0];
		const reels = await getUserReels({
			userId,
			userPk: topUser.pk,
			count: 12
		});

		// Add username to reels if missing
		const reelsWithUser = reels.map((reel) => ({
			...reel,
			username: reel.username || topUser.username
		}));

		const tableData = transformReelsToTableData(reelsWithUser);

		return json({
			user: topUser,
			results: tableData
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('Instagram search error:', error);
		return json({ error: 'Failed to search Instagram' }, { status: 500 });
	}
};
