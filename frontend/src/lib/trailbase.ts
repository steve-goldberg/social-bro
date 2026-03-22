import { initClient, type Client } from 'trailbase';
import { TRAILBASE_URL } from '$env/static/private';

let _client: Client | undefined;

/**
 * Server-side TrailBase client singleton.
 * Uses the TRAILBASE_URL env var configured in .env.
 */
export function getTrailBaseClient(): Client {
	if (!_client) {
		_client = initClient(TRAILBASE_URL);
	}
	return _client;
}
