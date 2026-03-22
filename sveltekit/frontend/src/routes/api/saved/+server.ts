import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';
import { decodeHtmlEntities } from '$lib/utils';
import type { Platform } from '$lib/types';

interface SavedSearchRecord {
	id: string;
	user_id: string;
	query: string;
	platform: Platform;
	created_at: string;
}

interface SavedSearchResultRecord {
	id: string;
	saved_search_id: string;
	external_id: string;
	title: string;
	creator_name: string;
	thumbnail: string | null;
	url: string;
	view_count: number;
	like_count: number;
	comment_count: number;
}

// GET - Fetch all saved searches for current user with pagination
export async function GET(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const limit = Math.min(Number(event.url.searchParams.get('limit')) || 20, 50);
		const offset = Number(event.url.searchParams.get('offset')) || 0;

		const client = getTrailBaseClient();

		const searchesResponse = await client.records<SavedSearchRecord>('saved_searches').list({
			filters: [{ column: 'user_id', value: userId }],
			order: ['-created_at'],
			pagination: { limit, offset }
		});

		// For each saved search, fetch its results
		const transformed = await Promise.all(
			searchesResponse.records.map(async (search) => {
				const resultsResponse = await client
					.records<SavedSearchResultRecord>('saved_search_results')
					.list({
						filters: [{ column: 'saved_search_id', value: search.id }]
					});

				return {
					id: search.id,
					query: search.query,
					platform: search.platform as Platform,
					createdAt: search.created_at,
					results: resultsResponse.records.map((r) => ({
						id: r.external_id,
						username: decodeHtmlEntities(r.creator_name),
						title: decodeHtmlEntities(r.title),
						views: Number(r.view_count),
						likes: Number(r.like_count),
						comments: Number(r.comment_count),
						engagementScore:
							Number(r.view_count) > 0
								? ((Number(r.like_count) + Number(r.comment_count)) / Number(r.view_count)) *
									100
								: 0,
						url: r.url,
						thumbnail: r.thumbnail
					}))
				};
			})
		);

		return json({ savedSearches: transformed });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error fetching saved searches:', error);
		return json({ error: 'Failed to fetch saved searches' }, { status: 500 });
	}
}

// POST - Save a new search with data for current user
export async function POST(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { query, platform, data } = body as {
			query: string;
			platform: Platform;
			data: Array<{
				id: string;
				username: string;
				title: string;
				views: number;
				likes: number;
				comments: number;
				url: string;
				thumbnail?: string;
			}>;
		};

		if (!query || !platform || !data) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Check if a saved search already exists for this user+query+platform
		const existing = await client.records<SavedSearchRecord>('saved_searches').list({
			filters: [
				{ column: 'user_id', value: userId },
				{ column: 'query', value: query },
				{ column: 'platform', value: platform }
			]
		});

		let savedSearchId: string;

		if (existing.records.length > 0) {
			savedSearchId = existing.records[0].id;

			// Update timestamp
			await client.records('saved_searches').update(savedSearchId, {
				created_at: new Date().toISOString()
			});

			// Delete old results
			const oldResults = await client
				.records<{ id: string }>('saved_search_results')
				.list({
					filters: [{ column: 'saved_search_id', value: savedSearchId }]
				});

			for (const oldResult of oldResults.records) {
				await client.records('saved_search_results').delete(oldResult.id);
			}
		} else {
			// Create new saved search
			const recordId = await client
				.records<Record<string, unknown>>('saved_searches')
				.create({
					user_id: userId,
					query,
					platform
				});
			savedSearchId = String(recordId);
		}

		// Create new results
		for (const item of data) {
			await client.records('saved_search_results').create({
				saved_search_id: savedSearchId,
				external_id: item.id,
				title: item.title,
				creator_name: item.username,
				thumbnail: item.thumbnail || null,
				url: item.url,
				view_count: item.views,
				like_count: item.likes,
				comment_count: item.comments
			});
		}

		return json({
			success: true,
			savedSearch: {
				id: savedSearchId,
				query,
				platform,
				createdAt: new Date().toISOString(),
				resultCount: data.length
			}
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
		console.error('Error saving search:', error);
		return json({ error: 'Failed to save search' }, { status: 500 });
	}
}

// DELETE - Remove a saved search for current user
export async function DELETE(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const id = event.url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Missing search ID' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Make sure the search belongs to this user
		const existing = await client.records<SavedSearchRecord>('saved_searches').list({
			filters: [
				{ column: 'id', value: id },
				{ column: 'user_id', value: userId }
			]
		});

		if (existing.records.length === 0) {
			return json({ error: 'Saved search not found' }, { status: 404 });
		}

		// Delete associated results first
		const results = await client
			.records<{ id: string }>('saved_search_results')
			.list({
				filters: [{ column: 'saved_search_id', value: id }]
			});

		for (const result of results.records) {
			await client.records('saved_search_results').delete(result.id);
		}

		// Delete the saved search
		await client.records('saved_searches').delete(id);

		return json({ success: true });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error deleting saved search:', error);
		return json({ error: 'Failed to delete saved search' }, { status: 500 });
	}
}
