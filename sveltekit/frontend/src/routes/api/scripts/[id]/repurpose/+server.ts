import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { repurposeScriptById } from '$lib/repurpose';
import { isApiError } from '$lib/errors';
import { checkRateLimit, RATE_LIMITS } from '$lib/rate-limit';

// POST - Repurpose a script
export const POST: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);
		const { id } = event.params;

		// Rate limit expensive operations
		const rateLimit = checkRateLimit(`repurpose:${userId}`, RATE_LIMITS.expensive);
		if (!rateLimit.success) {
			return json(
				{ error: 'Rate limit exceeded. Please try again later.' },
				{ status: 429 }
			);
		}

		const result = await repurposeScriptById(userId, id);

		return json({
			success: true,
			repurposedScript: result.repurposedScript,
			hooks: result.hooks,
			chunksProcessed: result.chunksProcessed,
		});
	} catch (err) {
		if (err instanceof Error) {
			if (err.message === 'Unauthorized') {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
			if (err.message === 'Script not found') {
				return json({ error: 'Script not found' }, { status: 404 });
			}
			if (err.message.includes('No LLM model selected')) {
				return json({ error: err.message }, { status: 400 });
			}
		}
		if (isApiError(err)) {
			return json({ error: err.message }, { status: err.statusCode });
		}
		console.error('Error repurposing script:', err);
		return json({ error: 'Failed to repurpose script' }, { status: 500 });
	}
};
