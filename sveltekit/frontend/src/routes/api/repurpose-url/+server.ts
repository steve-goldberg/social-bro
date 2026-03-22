import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';
import { getYouTubeTranscriptFast } from '$lib/rapidapi';
import { repurposeTranscript, type ProgressUpdate } from '$lib/repurpose';
import { isApiError } from '$lib/errors';
import { checkRateLimit, RATE_LIMITS } from '$lib/rate-limit';

interface ScriptRecord {
	id: string;
	user_id: string;
	title: string;
	script: string;
	repurposed_script: string | null;
	hooks: string[] | null;
	status: string;
	source_url: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
		/(?:youtu\.be\/)([^&\n?#]+)/,
		/(?:youtube\.com\/embed\/)([^&\n?#]+)/,
		/(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
		/(?:m\.youtube\.com\/watch\?v=)([^&\n?#]+)/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}

	return null;
}

/**
 * Get YouTube video title using oEmbed (no API key required)
 */
async function getYouTubeTitle(url: string): Promise<string | null> {
	try {
		const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
		const response = await fetch(oembedUrl);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return data.title || null;
	} catch {
		return null;
	}
}

// POST - Extract transcript from URL and repurpose it with streaming progress
export const POST: RequestHandler = async (event) => {
	// Check if client wants streaming
	const acceptHeader = event.request.headers.get('accept');
	const wantsStream = acceptHeader?.includes('text/event-stream');

	if (wantsStream) {
		return handleStreamingRequest(event);
	}

	return handleNonStreamingRequest(event);
};

// Streaming version with progress updates
async function handleStreamingRequest(event: Parameters<RequestHandler>[0]) {
	const encoder = new TextEncoder();

	// Use TransformStream for better streaming support
	const { readable, writable } = new TransformStream();
	const writer = writable.getWriter();

	// Helper to write and flush immediately
	const writeEvent = async (eventName: string, data: unknown) => {
		await writer.write(
			encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
		);
	};

	// Process in background while streaming response
	(async () => {
		try {
			const userId = await requireUserId(event);

			// Rate limit expensive operations
			const rateLimit = checkRateLimit(`repurpose:${userId}`, RATE_LIMITS.expensive);
			if (!rateLimit.success) {
				await writeEvent('error', {
					error: 'Rate limit exceeded. Please try again later.'
				});
				await writer.close();
				return;
			}

			let body;
			try {
				body = await event.request.json();
			} catch {
				await writeEvent('error', { error: 'Invalid JSON body' });
				await writer.close();
				return;
			}
			const { url, lang = 'en' } = body as { url: string; lang?: string };

			if (!url) {
				await writeEvent('error', { error: 'URL is required' });
				await writer.close();
				return;
			}

			const videoId = extractVideoId(url);
			if (!videoId) {
				await writeEvent('error', { error: 'Invalid YouTube URL' });
				await writer.close();
				return;
			}

			const client = getTrailBaseClient();

			// Check for existing script
			const existingResponse = await client.records<ScriptRecord>('scripts').list({
				filters: [
					{ column: 'source_url', value: url },
					{ column: 'user_id', value: userId }
				]
			});

			const existingScript =
				existingResponse.records.length > 0 ? existingResponse.records[0] : null;

			if (existingScript?.repurposed_script) {
				await writeEvent('complete', {
					success: true,
					script: {
						id: existingScript.id,
						title: existingScript.title,
						script: existingScript.script,
						repurposedScript: existingScript.repurposed_script,
						hooks: existingScript.hooks,
						status: existingScript.status,
						createdAt: existingScript.created_at,
						updatedAt: existingScript.updated_at
					},
					alreadyExists: true
				});
				await writer.close();
				return;
			}

			// Send progress: extracting
			await writeEvent('progress', {
				step: 'extracting',
				message: 'Extracting transcript from YouTube'
			});

			// Get video title and transcript
			const [videoTitle, transcriptResult] = await Promise.all([
				getYouTubeTitle(url),
				getYouTubeTranscriptFast({ userId, videoUrl: url, lang })
			]);

			// Create script record
			let scriptId: string;
			if (existingScript) {
				scriptId = existingScript.id;
			} else {
				scriptId = String(
					await client.records('scripts').create({
						user_id: userId,
						title: videoTitle || `YouTube Video ${videoId}`,
						script: transcriptResult.transcript,
						source_url: url,
						status: 'draft'
					})
				);
			}

			// Repurpose with progress callback
			const repurposeResult = await repurposeTranscript(
				userId,
				transcriptResult.transcript,
				async (update: ProgressUpdate) => {
					await writeEvent('progress', update);
				}
			);

			// Update script with repurposed content
			await client.records('scripts').update(scriptId, {
				repurposed_script: repurposeResult.repurposedScript,
				hooks: repurposeResult.hooks,
				status: 'in_progress'
			});

			// Re-read updated script
			const updatedResponse = await client.records<ScriptRecord>('scripts').list({
				filters: [{ column: 'id', value: scriptId }]
			});
			const updatedScript = updatedResponse.records[0];

			// Send completion event
			await writeEvent('complete', {
				success: true,
				script: {
					id: updatedScript.id,
					title: updatedScript.title,
					script: updatedScript.script,
					repurposedScript: updatedScript.repurposed_script,
					hooks: updatedScript.hooks,
					status: updatedScript.status,
					createdAt: updatedScript.created_at,
					updatedAt: updatedScript.updated_at
				},
				chunksProcessed: repurposeResult.chunksProcessed,
				alreadyExists: false
			});

			await writer.close();
		} catch (err) {
			let errorMessage = 'Failed to repurpose';

			if (err instanceof Error) {
				errorMessage = err.message;
			}

			if (isApiError(err)) {
				errorMessage = err.message;
			}

			console.error('Error repurposing URL:', err);
			await writeEvent('error', { error: errorMessage });
			await writer.close();
		}
	})();

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
}

// Non-streaming version for backwards compatibility
async function handleNonStreamingRequest(event: Parameters<RequestHandler>[0]) {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { url, lang = 'en' } = body as {
			url: string;
			lang?: string;
		};

		if (!url) {
			return json({ error: 'URL is required' }, { status: 400 });
		}

		// Extract video ID for validation and title
		const videoId = extractVideoId(url);
		if (!videoId) {
			return json({ error: 'Invalid YouTube URL' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Check if a script already exists for this URL
		const existingResponse = await client.records<ScriptRecord>('scripts').list({
			filters: [
				{ column: 'source_url', value: url },
				{ column: 'user_id', value: userId }
			]
		});

		const existingScript =
			existingResponse.records.length > 0 ? existingResponse.records[0] : null;

		if (existingScript) {
			// If already repurposed, return it
			if (existingScript.repurposed_script) {
				return json({
					success: true,
					script: {
						id: existingScript.id,
						title: existingScript.title,
						script: existingScript.script,
						repurposedScript: existingScript.repurposed_script,
						hooks: existingScript.hooks,
						status: existingScript.status,
						createdAt: existingScript.created_at,
						updatedAt: existingScript.updated_at
					},
					alreadyExists: true
				});
			}
		}

		// Get video title and extract transcript in parallel
		const [videoTitle, transcriptResult] = await Promise.all([
			getYouTubeTitle(url),
			getYouTubeTranscriptFast({
				userId,
				videoUrl: url,
				lang
			})
		]);

		// Create or use existing script
		let scriptId: string;
		if (existingScript) {
			scriptId = existingScript.id;
		} else {
			scriptId = String(
				await client.records('scripts').create({
					user_id: userId,
					title: videoTitle || `YouTube Video ${videoId}`,
					script: transcriptResult.transcript,
					source_url: url,
					status: 'draft'
				})
			);
		}

		// Repurpose the transcript
		const repurposeResult = await repurposeTranscript(userId, transcriptResult.transcript);

		// Update script with repurposed content
		await client.records('scripts').update(scriptId, {
			repurposed_script: repurposeResult.repurposedScript,
			hooks: repurposeResult.hooks,
			status: 'in_progress'
		});

		// Re-read updated script
		const updatedResponse = await client.records<ScriptRecord>('scripts').list({
			filters: [{ column: 'id', value: scriptId }]
		});
		const updatedScript = updatedResponse.records[0];

		return json({
			success: true,
			script: {
				id: updatedScript.id,
				title: updatedScript.title,
				script: updatedScript.script,
				repurposedScript: updatedScript.repurposed_script,
				hooks: updatedScript.hooks,
				status: updatedScript.status,
				createdAt: updatedScript.created_at,
				updatedAt: updatedScript.updated_at
			},
			chunksProcessed: repurposeResult.chunksProcessed,
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
			if (err.message.includes('No LLM model selected')) {
				return json({ error: err.message }, { status: 400 });
			}
		}
		if (isApiError(err)) {
			return json({ error: err.message }, { status: err.statusCode });
		}
		console.error('Error repurposing URL:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to repurpose' },
			{ status: 500 }
		);
	}
}
