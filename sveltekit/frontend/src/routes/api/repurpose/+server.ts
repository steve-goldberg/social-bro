import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';

// GET - Fetch all repurpose videos for current user
export const GET: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		const limit = Math.min(Number(event.url.searchParams.get('limit')) || 50, 100);
		const offset = Number(event.url.searchParams.get('offset')) || 0;

		const client = getTrailBaseClient();

		const videos = await client
			.records('repurpose_videos')
			.list({
				filters: [`user_id = '${userId}'`],
				order: ['-saved_at'],
				limit,
				offset,
			}) as Record<string, unknown>[];

		// For each video, check if it has a script (transcript)
		const transformed = await Promise.all(
			videos.map(async (video) => {
				const scripts = await client
					.records('scripts')
					.list({
						filters: [`repurpose_video_id = '${video.id}'`],
						limit: 1,
					});

				return {
					id: video.id,
					externalId: video.external_id,
					platform: video.platform,
					title: video.title,
					description: video.description,
					thumbnail: video.thumbnail,
					url: video.url,
					creatorId: video.creator_id,
					creatorName: video.creator_name,
					viewCount: video.view_count ? Number(video.view_count) : null,
					likeCount: video.like_count ? Number(video.like_count) : null,
					commentCount: video.comment_count ? Number(video.comment_count) : null,
					savedAt: video.saved_at,
					hasTranscript: scripts.length > 0,
				};
			})
		);

		return json({ videos: transformed });
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error fetching repurpose videos:', err);
		return json({ error: 'Failed to fetch repurpose videos' }, { status: 500 });
	}
};

// POST - Add a video to repurpose list
export const POST: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const {
			externalId,
			platform,
			title,
			description,
			thumbnail,
			url,
			creatorId,
			creatorName,
			viewCount,
			likeCount,
			commentCount,
		} = body as {
			externalId: string;
			platform: string;
			title: string;
			description?: string;
			thumbnail?: string;
			url: string;
			creatorId?: string;
			creatorName?: string;
			viewCount?: number;
			likeCount?: number;
			commentCount?: number;
		};

		if (!externalId || !platform || !title || !url) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Check if video already exists for this user
		const existing = await client
			.records('repurpose_videos')
			.list({
				filters: [
					`user_id = '${userId}'`,
					`external_id = '${externalId}'`,
					`platform = '${platform}'`,
				],
				limit: 1,
			}) as Record<string, unknown>[];

		let video: Record<string, unknown>;
		const videoData = {
			title,
			description: description || null,
			thumbnail: thumbnail || null,
			url,
			creator_id: creatorId || null,
			creator_name: creatorName || null,
			view_count: viewCount !== undefined ? viewCount : null,
			like_count: likeCount !== undefined ? likeCount : null,
			comment_count: commentCount !== undefined ? commentCount : null,
		};

		if (existing.length > 0) {
			// Update existing
			await client.records('repurpose_videos').update(existing[0].id as string, {
				...videoData,
				saved_at: new Date().toISOString(),
			});
			video = (await client
				.records('repurpose_videos')
				.read(existing[0].id as string)) as Record<string, unknown>;
		} else {
			// Create new
			video = (await client.records('repurpose_videos').create({
				user_id: userId,
				external_id: externalId,
				platform,
				...videoData,
			})) as Record<string, unknown>;
		}

		return json({
			success: true,
			video: {
				id: video.id,
				externalId: video.external_id,
				title: video.title,
				savedAt: video.saved_at,
			},
		});
	} catch (err) {
		if (err instanceof Error) {
			if (err.message === 'Unauthorized') {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
			if (err.message === 'InvalidSession') {
				return json(
					{ error: 'Session invalid. Please log out and log in again.' },
					{ status: 401 }
				);
			}
		}
		console.error('Error saving repurpose video:', err);
		return json({ error: 'Failed to save video' }, { status: 500 });
	}
};

// DELETE - Remove a video from repurpose list
export const DELETE: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		const id = event.url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Missing video ID' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Make sure the video belongs to this user
		const existing = await client
			.records('repurpose_videos')
			.read(id) as Record<string, unknown>;

		if (!existing || existing.user_id !== userId) {
			return json({ error: 'Video not found' }, { status: 404 });
		}

		await client.records('repurpose_videos').delete(id);

		return json({ success: true });
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error deleting repurpose video:', err);
		return json({ error: 'Failed to delete video' }, { status: 500 });
	}
};
