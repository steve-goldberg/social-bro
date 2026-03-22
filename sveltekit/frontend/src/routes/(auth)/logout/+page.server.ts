import type { Actions } from './$types.js';
import { redirect } from '@sveltejs/kit';
import {
	trailbaseLogout,
	clearAuthCookies,
	REFRESH_COOKIE
} from '$lib/server/auth.js';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const refreshToken = cookies.get(REFRESH_COOKIE);
		if (refreshToken) {
			await trailbaseLogout(refreshToken).catch(() => {
				// Best-effort: even if TrailBase logout fails, clear local cookies
			});
		}
		clearAuthCookies(cookies);
		redirect(303, '/login');
	}
};
