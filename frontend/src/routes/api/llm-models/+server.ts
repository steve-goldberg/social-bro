import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';

interface LlmModelRecord {
	id: string;
	model_id: string;
	name: string;
	provider: string;
	prompt_price: number;
	completion_price: number;
	context_length: number | null;
	created_at: string;
	updated_at: string;
}

// GET - Fetch all synced LLM models
export async function GET(event: RequestEvent) {
	try {
		await requireUserId(event);

		const client = getTrailBaseClient();
		const response = await client.records<LlmModelRecord>('llm_models').list({
			order: ['provider', 'name']
		});

		const models = response.records.map((m) => ({
			id: m.id,
			modelId: m.model_id,
			name: m.name,
			provider: m.provider,
			promptPrice: m.prompt_price,
			completionPrice: m.completion_price,
			contextLength: m.context_length,
			createdAt: m.created_at,
			updatedAt: m.updated_at
		}));

		// Models rarely change, cache for 1 hour
		return json({ models }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error fetching LLM models:', error);
		return json({ error: 'Failed to fetch models' }, { status: 500 });
	}
}
