import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';

// GET - Fetch user settings
export async function GET(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);
		const client = getTrailBaseClient();

		const response = await client
			.records<{ id: string; selected_model_id: string | null }>('user_settings')
			.list({
				filters: [{ column: 'user_id', value: userId }]
			});

		const settings = response.records[0];

		return json({
			selectedModelId: settings?.selected_model_id || null
		});
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error fetching user settings:', error);
		return json({ error: 'Failed to fetch settings' }, { status: 500 });
	}
}

// POST - Update user settings
export async function POST(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { selectedModelId } = body as { selectedModelId?: string | null };

		const client = getTrailBaseClient();

		// Check if settings already exist for this user
		const existing = await client.records<{ id: string }>('user_settings').list({
			filters: [{ column: 'user_id', value: userId }]
		});

		if (existing.records.length > 0) {
			await client.records('user_settings').update(existing.records[0].id, {
				selected_model_id: selectedModelId
			});
		} else {
			await client.records('user_settings').create({
				user_id: userId,
				selected_model_id: selectedModelId
			});
		}

		return json({ success: true, selectedModelId });
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
		console.error('Error updating user settings:', error);
		return json({ error: 'Failed to update settings' }, { status: 500 });
	}
}
