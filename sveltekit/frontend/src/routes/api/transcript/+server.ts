import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';
import { getYouTubeTranscript } from '$lib/rapidapi';
import { isApiError } from '$lib/errors';
import { checkRateLimit, RATE_LIMITS } from '$lib/rate-limit';

// POST - Extract transcript from a repurpose video and save as script
export const POST: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		// Rate limit expensive operations
		const rateLimit = checkRateLimit(`transcript:${userId}`, RATE_LIMITS.expensive);
		if (!rateLimit.success) {
			return json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
		}

		let body;
		try {
			body = await event.request.json();
		} catch {
			return json({ error: 'Invalid JSON body' }, { status: 400 });
		}
		const { repurposeVideoId, lang = 'en' } = body as {
			repurposeVideoId: string;
			lang?: string;
		};

		if (!repurposeVideoId) {
			return json({ error: 'repurposeVideoId is required' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Get the repurpose video
		const repurposeVideo = await client
			.records('repurpose_videos')
			.read(repurposeVideoId) as Record<string, unknown>;

		if (!repurposeVideo || repurposeVideo.user_id !== userId) {
			return json({ error: 'Video not found' }, { status: 404 });
		}

		// Only YouTube videos support transcript extraction
		if (repurposeVideo.platform !== 'youtube') {
			return json(
				{ error: 'Transcript extraction is only available for YouTube videos' },
				{ status: 400 }
			);
		}

		// Check if a script already exists for this video
		const existingScripts = await client
			.records('scripts')
			.list({
				filters: [`repurpose_video_id = '${repurposeVideoId}'`, `user_id = '${userId}'`],
				limit: 1,
			});

		if (existingScripts.length > 0) {
			const existingScript = existingScripts[0] as Record<string, unknown>;
			return json({
				success: true,
				script: {
					id: existingScript.id,
					title: existingScript.title,
					script: existingScript.script,
					status: existingScript.status,
					sourceUrl: existingScript.source_url,
					createdAt: existingScript.created_at,
					updatedAt: existingScript.updated_at,
				},
				alreadyExists: true,
			});
		}

		// Extract transcript
		const result = await getYouTubeTranscript({
			userId,
			videoUrl: repurposeVideo.url as string,
			lang,
		});

		// Create script with the transcript
		const script = await client
			.records('scripts')
			.create({
				user_id: userId,
				title: repurposeVideo.title,
				script: result.transcript,
				source_url: repurposeVideo.url,
				repurpose_video_id: repurposeVideo.id,
				status: 'draft',
			}) as Record<string, unknown>;

		return json({
			success: true,
			script: {
				id: script.id,
				title: script.title,
				script: script.script,
				status: script.status,
				sourceUrl: script.source_url,
				createdAt: script.created_at,
				updatedAt: script.updated_at,
			},
			alreadyExists: false,
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
		if (isApiError(err)) {
			return json({ error: err.message }, { status: err.statusCode });
		}
		console.error('Error extracting transcript:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to extract transcript' },
			{ status: 500 }
		);
	}
};
