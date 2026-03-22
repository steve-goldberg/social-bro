import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUserId } from '$lib/auth-utils';
import { getTrailBaseClient } from '$lib/trailbase';

// GET - Fetch all scripts for current user
export const GET: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		const limit = Math.min(Number(event.url.searchParams.get('limit')) || 50, 100);
		const offset = Number(event.url.searchParams.get('offset')) || 0;
		const status = event.url.searchParams.get('status');

		const client = getTrailBaseClient();

		const filters: Array<{ column: string; value: string }> = [
			{ column: 'user_id', value: userId }
		];
		if (status) {
			filters.push({ column: 'status', value: status });
		}

		const response = await client.records<Record<string, unknown>>('scripts').list({
			filters,
			pagination: { limit, offset }
		});

		const transformed = response.records.map((script) => ({
			id: script.id,
			title: script.title,
			caption: script.caption,
			script: script.script,
			repurposedScript: script.repurposed_script,
			hooks: script.hooks,
			notes: script.notes,
			status: script.status,
			createdAt: script.created_at,
			updatedAt: script.updated_at
		}));

		return json(
			{ scripts: transformed },
			{ headers: { 'Cache-Control': 'private, max-age=300' } }
		);
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Error fetching scripts:', err);
		return json({ error: 'Failed to fetch scripts' }, { status: 500 });
	}
};

// POST - Create a new script
export const POST: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { title, caption, script, notes, status } = body as {
			title: string;
			caption?: string;
			script: string;
			notes?: string;
			status?: string;
		};

		if (!title || !script) {
			return json({ error: 'Title and script are required' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		const newId = await client.records('scripts').create({
			user_id: userId,
			title,
			caption: caption || null,
			script,
			notes: notes || null,
			status: status || 'draft'
		});

		return json({
			success: true,
			script: { id: newId, title, caption: caption || null, script, notes: notes || null, status: status || 'draft' }
		});
	} catch (err) {
		if (err instanceof Error) {
			if (err.message === 'Unauthorized') return json({ error: 'Unauthorized' }, { status: 401 });
			if (err.message === 'InvalidSession')
				return json({ error: 'Session invalid. Please log out and log in again.' }, { status: 401 });
		}
		console.error('Error creating script:', err);
		return json({ error: 'Failed to create script' }, { status: 500 });
	}
};

// PUT - Update an existing script
export const PUT: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { id, title, caption, script, notes, status } = body as {
			id: string; title?: string; caption?: string; script?: string; notes?: string; status?: string;
		};

		if (!id) return json({ error: 'Script ID is required' }, { status: 400 });

		const client = getTrailBaseClient();
		const existing = await client.records<Record<string, unknown>>('scripts').read(id);
		if (!existing || existing.user_id !== userId) return json({ error: 'Script not found' }, { status: 404 });

		const updateData: Record<string, unknown> = {};
		if (title !== undefined) updateData.title = title;
		if (caption !== undefined) updateData.caption = caption;
		if (script !== undefined) updateData.script = script;
		if (notes !== undefined) updateData.notes = notes;
		if (status !== undefined) updateData.status = status;

		await client.records('scripts').update(id, updateData);
		const updated = await client.records<Record<string, unknown>>('scripts').read(id);

		return json({
			success: true,
			script: {
				id: updated.id, title: updated.title, caption: updated.caption,
				script: updated.script, notes: updated.notes, status: updated.status,
				createdAt: updated.created_at, updatedAt: updated.updated_at
			}
		});
	} catch (err) {
		if (err instanceof Error) {
			if (err.message === 'Unauthorized') return json({ error: 'Unauthorized' }, { status: 401 });
			if (err.message === 'InvalidSession')
				return json({ error: 'Session invalid. Please log out and log in again.' }, { status: 401 });
		}
		console.error('Error updating script:', err);
		return json({ error: 'Failed to update script' }, { status: 500 });
	}
};

// DELETE - Remove a script
export const DELETE: RequestHandler = async (event) => {
	try {
		const userId = await requireUserId(event);
		const id = event.url.searchParams.get('id');
		if (!id) return json({ error: 'Missing script ID' }, { status: 400 });

		const client = getTrailBaseClient();
		const existing = await client.records<Record<string, unknown>>('scripts').read(id);
		if (!existing || existing.user_id !== userId) return json({ error: 'Script not found' }, { status: 404 });

		await client.records('scripts').delete(id);
		return json({ success: true });
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized')
			return json({ error: 'Unauthorized' }, { status: 401 });
		console.error('Error deleting script:', err);
		return json({ error: 'Failed to delete script' }, { status: 500 });
	}
};
