import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';
import { getYouTubeTranscriptFast } from '$lib/rapidapi';
import { isApiError } from '$lib/errors';
import { checkRateLimit, RATE_LIMITS } from '$lib/rate-limit';

interface RepurposeVideoRecord {
	id: string;
	user_id: string;
	platform: string;
	title: string;
	url: string;
}

interface ScriptRecord {
	id: string;
	user_id: string;
	title: string;
	script: string;
	status: string;
	source_url: string | null;
	repurpose_video_id: string | null;
	created_at: string;
	updated_at: string;
}

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
		const videosResponse = await client
			.records<RepurposeVideoRecord>('repurpose_videos')
			.list({
				filters: [
					{ column: 'id', value: repurposeVideoId },
					{ column: 'user_id', value: userId }
				]
			});

		if (videosResponse.records.length === 0) {
			return json({ error: 'Video not found' }, { status: 404 });
		}

		const repurposeVideo = videosResponse.records[0];

		// Only YouTube videos support transcript extraction
		if (repurposeVideo.platform !== 'youtube') {
			return json(
				{ error: 'Transcript extraction is only available for YouTube videos' },
				{ status: 400 }
			);
		}

		// Check if a script already exists for this video
		const existingScriptsResponse = await client
			.records<ScriptRecord>('scripts')
			.list({
				filters: [
					{ column: 'repurpose_video_id', value: repurposeVideoId },
					{ column: 'user_id', value: userId }
				]
			});

		if (existingScriptsResponse.records.length > 0) {
			const existingScript = existingScriptsResponse.records[0];
			return json({
				success: true,
				script: {
					id: existingScript.id,
					title: existingScript.title,
					script: existingScript.script,
					status: existingScript.status,
					sourceUrl: existingScript.source_url,
					createdAt: existingScript.created_at,
					updatedAt: existingScript.updated_at
				},
				alreadyExists: true
			});
		}

		// Extract transcript
		const result = await getYouTubeTranscriptFast({
			userId,
			videoUrl: repurposeVideo.url,
			lang
		});

		// Create script with the transcript
		const scriptId = String(
			await client.records('scripts').create({
				user_id: userId,
				title: repurposeVideo.title,
				script: result.transcript,
				source_url: repurposeVideo.url,
				repurpose_video_id: repurposeVideo.id,
				status: 'draft'
			})
		);

		// Re-read the created script to get all fields
		const createdScriptsResponse = await client
			.records<ScriptRecord>('scripts')
			.list({
				filters: [{ column: 'id', value: scriptId }]
			});
		const script = createdScriptsResponse.records[0];

		return json({
			success: true,
			script: {
				id: script.id,
				title: script.title,
				script: script.script,
				status: script.status,
				sourceUrl: script.source_url,
				createdAt: script.created_at,
				updatedAt: script.updated_at
			},
			alreadyExists: false
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
