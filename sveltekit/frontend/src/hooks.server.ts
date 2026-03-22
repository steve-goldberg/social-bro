import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';
import {
	AUTH_COOKIE,
	REFRESH_COOKIE,
	trailbaseRefresh,
	setAuthCookies
} from '$lib/server/auth.js';

type TokenClaims = {
	sub: string;
	email: string;
	exp: number;
	admin?: boolean;
};

/** Routes that don't require authentication */
const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/api/health'];

function isPublicPath(pathname: string): boolean {
	return PUBLIC_PATHS.some(
		(p) => pathname === p || pathname.startsWith(p + '/')
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const { cookies, url } = event;
	const authToken = cookies.get(AUTH_COOKIE);
	const refreshToken = cookies.get(REFRESH_COOKIE);

	let user: { id: string; email: string } | null = null;

	if (authToken) {
		try {
			const claims = jwtDecode<TokenClaims>(authToken);
			const now = Date.now() / 1000;

			if (claims.exp > now) {
				user = { id: claims.sub, email: claims.email };
			} else if (refreshToken) {
				// Auth token expired — try refresh
				const refreshed = await trailbaseRefresh(refreshToken);
				const secure = url.protocol === 'https:';
				setAuthCookies(
					cookies,
					{
						auth_token: refreshed.auth_token,
						refresh_token: refreshToken,
						csrf_token: refreshed.csrf_token
					},
					secure
				);
				const newClaims = jwtDecode<TokenClaims>(refreshed.auth_token);
				user = { id: newClaims.sub, email: newClaims.email };
			}
		} catch {
			// Invalid token — treat as unauthenticated
		}
	}

	// Attach user to locals for downstream use
	event.locals.user = user;

	// Protect non-public routes
	if (!user && !isPublicPath(url.pathname)) {
		redirect(303, '/login');
	}

	// Redirect authenticated users away from auth pages
	if (user && (url.pathname === '/login' || url.pathname === '/register')) {
		redirect(303, '/');
	}

	return resolve(event);
};
