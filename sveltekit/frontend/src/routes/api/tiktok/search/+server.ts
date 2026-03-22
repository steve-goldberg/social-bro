import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchTikTok, transformSearchResultsToTableData } from '$lib/rapidapi';
import { requireUserId } from '$lib/auth-utils';
import { isApiError } from '$lib/errors';
import { checkRateLimit, RATE_LIMITS } from '$lib/rate-limit';

export const GET: RequestHandler = async (event) => {
	const keyword = event.url.searchParams.get('q');

	if (!keyword) {
		return json({ error: 'Query parameter "q" is required' }, { status: 400 });
	}

	try {
		const userId = await requireUserId(event);

		const rateLimit = checkRateLimit(`tiktok:${userId}`, RATE_LIMITS.search);
		if (!rateLimit.success) {
			return json(
				{ error: 'Rate limit exceeded. Please try again later.' },
				{ status: 429 }
			);
		}

		const results = await searchTikTok({
			userId,
			keyword
		});

		const tableData = transformSearchResultsToTableData(results);

		return json({ results: tableData });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('TikTok search error:', error);
		return json({ error: 'Failed to search TikTok' }, { status: 500 });
	}
};
