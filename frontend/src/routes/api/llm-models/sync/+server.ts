import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';
import { fetchOpenRouterModels } from '$lib/openrouter';
import { isApiError } from '$lib/errors';

// POST - Sync models from OpenRouter
export async function POST(event: RequestEvent) {
	try {
		await requireUserId(event);

		// Fetch models from OpenRouter (doesn't require auth)
		const openRouterModels = await fetchOpenRouterModels();

		// Filter to only include text models (exclude image, audio, etc.)
		const textModels = openRouterModels.filter((model) => {
			const modality = model.architecture?.modality?.toLowerCase() || '';
			return modality.includes('text') || modality === '' || !model.architecture?.modality;
		});

		const client = getTrailBaseClient();

		// Upsert each model
		for (const model of textModels) {
			// Parse provider from model ID (e.g., "openai/gpt-4" -> "OpenAI")
			const providerSlug = model.id.split('/')[0];
			const provider = providerSlug
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');

			// Parse prices (they come as string, price per token)
			// OpenRouter returns price per token, we store as price per 1M tokens
			const promptPrice = parseFloat(model.pricing.prompt) * 1_000_000;
			const completionPrice = parseFloat(model.pricing.completion) * 1_000_000;

			const modelData = {
				model_id: model.id,
				name: model.name,
				provider,
				prompt_price: promptPrice,
				completion_price: completionPrice,
				context_length: model.context_length || null
			};

			// Check if model already exists
			const existing = await client
				.records<{ id: string }>('llm_models')
				.list({
					filters: [{ column: 'model_id', value: model.id }]
				});

			if (existing.records.length > 0) {
				await client.records('llm_models').update(existing.records[0].id, {
					...modelData,
					updated_at: new Date().toISOString()
				});
			} else {
				await client.records('llm_models').create(modelData);
			}
		}

		const synced = textModels.length;

		return json({
			success: true,
			synced,
			message: `Synced ${synced} models from OpenRouter`
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiError(error)) {
			return json({ error: error.message }, { status: error.statusCode });
		}
		console.error('Error syncing LLM models:', error);
		return json({ error: 'Failed to sync models' }, { status: 500 });
	}
}
