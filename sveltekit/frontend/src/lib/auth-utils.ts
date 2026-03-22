import { getTrailBaseClient } from '$lib/trailbase';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Extract user ID from TrailBase session.
 * TrailBase auth uses JWT tokens stored in cookies.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getCurrentUserId(_event: RequestEvent): Promise<string | null> {
	// TrailBase stores auth tokens in cookies
	// The client can be initialized from cookies to get the current user
	const client = getTrailBaseClient();
	const user = client.user();
	return user?.id ?? null;
}

/**
 * Require an authenticated user. Throws 401 if not authenticated.
 */
export async function requireUserId(event: RequestEvent): Promise<string> {
	const userId = await getCurrentUserId(event);
	if (!userId) {
		throw new Error('Unauthorized');
	}
	return userId;
}
