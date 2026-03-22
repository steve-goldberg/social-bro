import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { encrypt, decrypt, maskApiKey } from '$lib/crypto';
import { requireUserId } from '$lib/auth-utils';
import { invalidateCachedApiKey } from '$lib/cache';
import { getTrailBaseClient } from '$lib/trailbase';

type ApiKeyService = 'youtube' | 'rapidapi' | 'openrouter';

interface ApiKeyResponse {
	service: ApiKeyService;
	maskedKey: string | null;
	hasKey: boolean;
}

const VALID_SERVICES: ApiKeyService[] = ['youtube', 'rapidapi', 'openrouter'];

// GET - Fetch all API keys (masked) for current user
export async function GET(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);
		const client = getTrailBaseClient();

		const apiKeysResponse = await client.records<{ service: string; key: string }>('api_keys').list({
			filters: [{ column: 'user_id', value: userId }]
		});
		const apiKeys = apiKeysResponse.records;

		const response: ApiKeyResponse[] = VALID_SERVICES.map((service) => {
			const found = apiKeys.find((k) => k.service === service);
			if (found) {
				try {
					const decrypted = decrypt(found.key);
					return {
						service,
						maskedKey: maskApiKey(decrypted),
						hasKey: true
					};
				} catch {
					// Key exists but can't be decrypted (wrong encryption secret)
					console.warn(
						`Failed to decrypt ${service} API key - encryption secret may have changed`
					);
					return {
						service,
						maskedKey: null,
						hasKey: false
					};
				}
			}
			return {
				service,
				maskedKey: null,
				hasKey: false
			};
		});

		return json(response, { headers: { 'Cache-Control': 'private, max-age=300' } });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Failed to fetch API keys:', error);
		return json({ error: 'Failed to fetch API keys' }, { status: 500 });
	}
}

// POST - Save or update an API key for current user
export async function POST(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const body = await event.request.json();
		const { service, key } = body as { service: ApiKeyService; key: string };

		if (!service || !key) {
			return json({ error: 'Service and key are required' }, { status: 400 });
		}

		if (!VALID_SERVICES.includes(service)) {
			return json({ error: 'Invalid service' }, { status: 400 });
		}

		const encryptedKey = encrypt(key);
		const client = getTrailBaseClient();

		// Check if key already exists for this user+service
		const existing = await client
			.records<{ id: string }>('api_keys')
			.list({
				filters: [
					{ column: 'user_id', value: userId },
					{ column: 'service', value: service }
				]
			});

		if (existing.records.length > 0) {
			await client.records('api_keys').update(existing.records[0].id, {
				key: encryptedKey
			});
		} else {
			await client.records('api_keys').create({
				user_id: userId,
				service,
				key: encryptedKey
			});
		}

		// Invalidate cached key so next request fetches fresh data
		invalidateCachedApiKey(userId, service);

		return json({
			success: true,
			service,
			maskedKey: maskApiKey(key)
		});
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
		console.error('Failed to save API key:', error);
		return json({ error: 'Failed to save API key' }, { status: 500 });
	}
}

// DELETE - Remove an API key for current user
export async function DELETE(event: RequestEvent) {
	try {
		const userId = await requireUserId(event);

		const service = event.url.searchParams.get('service');

		if (!service) {
			return json({ error: 'Service is required' }, { status: 400 });
		}

		if (!VALID_SERVICES.includes(service as ApiKeyService)) {
			return json({ error: 'Invalid service' }, { status: 400 });
		}

		const client = getTrailBaseClient();

		// Check if the key exists before deleting
		const existing = await client
			.records<{ id: string }>('api_keys')
			.list({
				filters: [
					{ column: 'user_id', value: userId },
					{ column: 'service', value: service }
				]
			});

		if (existing.records.length === 0) {
			return json({ error: 'API key not found' }, { status: 404 });
		}

		await client.records('api_keys').delete(existing.records[0].id);

		// Invalidate cached key
		invalidateCachedApiKey(userId, service);

		return json({ success: true });
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		console.error('Failed to delete API key:', error);
		return json({ error: 'Failed to delete API key' }, { status: 500 });
	}
}
