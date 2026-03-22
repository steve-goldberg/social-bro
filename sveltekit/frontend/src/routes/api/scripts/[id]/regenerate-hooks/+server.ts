import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';
import { createChatCompletion } from '$lib/openrouter';
import { HOOKS_SYSTEM_PROMPT, HOOKS_PROMPT } from '$lib/repurpose/prompts';
import { extractOriginalHook } from '$lib/repurpose/chunker';

// POST - Regenerate hooks for a script
export const POST: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);
		const { id } = event.params;

		const client = getTrailBaseClient();

		// Get the script
		const script = await client.records<Record<string, unknown>>('scripts').read(id);

		if (!script) {
			return json({ error: 'Script not found' }, { status: 404 });
		}

		if (script.user_id !== userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user's selected model
		const settingsResponse = await client
			.records<Record<string, unknown>>('user_settings')
			.list({
				filters: [{ column: 'user_id', value: userId }],
				pagination: { limit: 1 }
			});

		const settings = settingsResponse.records.length > 0 ? settingsResponse.records[0] : null;

		if (!settings?.selected_model_id) {
			return json(
				{ error: 'No LLM model selected. Please select a model in Settings.' },
				{ status: 400 }
			);
		}

		// Extract original hook from the script
		const originalHook = extractOriginalHook(script.script as string);
		const prompt = HOOKS_PROMPT.replace('{originalHook}', originalHook);

		// Generate new hooks
		const response = await createChatCompletion({
			userId,
			model: settings.selected_model_id as string,
			messages: [
				{ role: 'system', content: HOOKS_SYSTEM_PROMPT },
				{ role: 'user', content: prompt }
			],
			temperature: 0.9
		});

		const content = response.choices[0]?.message?.content || '[]';

		// Parse the JSON array
		let hooks: string[] = [];
		try {
			const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
			const parsed = JSON.parse(cleanedContent);

			if (Array.isArray(parsed) && parsed.length >= 3) {
				hooks = parsed.slice(0, 3);
			} else if (Array.isArray(parsed)) {
				hooks = parsed;
			}
		} catch {
			// Fallback: try to extract hooks from text
			const lines = content.split('\n').filter((line) => line.trim().length > 10);
			hooks = lines.slice(0, 3).map((line) => line.replace(/^[\d.\-*]+\s*/, '').trim());
		}

		// Update the script with new hooks
		await client.records('scripts').update(id, { hooks: JSON.stringify(hooks) });

		return json({ success: true, hooks });
	} catch (err) {
		console.error('Error regenerating hooks:', err);
		return json({ error: 'Failed to regenerate hooks' }, { status: 500 });
	}
};
