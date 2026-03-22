import { TRAILBASE_URL } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

export type TrailBaseTokens = {
	auth_token: string;
	refresh_token: string;
	csrf_token: string;
};

/**
 * Login via TrailBase JSON API.
 * Returns tokens on success, throws on failure.
 */
export async function trailbaseLogin(
	email: string,
	password: string
): Promise<TrailBaseTokens> {
	const res = await fetch(`${TRAILBASE_URL}/api/auth/v1/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});

	if (!res.ok) {
		if (res.status === 401) {
			throw new Error('Invalid email or password');
		}
		if (res.status === 403) {
			throw new Error('Email not verified. Please check your inbox.');
		}
		const text = await res.text().catch(() => '');
		throw new Error(text || `Login failed (${res.status})`);
	}

	return (await res.json()) as TrailBaseTokens;
}

/**
 * Register via TrailBase JSON API.
 * TrailBase returns 303 for form requests; for JSON we get 200 or error.
 */
export async function trailbaseRegister(
	email: string,
	password: string,
	passwordRepeat: string
): Promise<void> {
	const res = await fetch(`${TRAILBASE_URL}/api/auth/v1/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email,
			password,
			password_repeat: passwordRepeat
		})
	});

	// 200 or 303 = success (user created, verification email sent)
	if (res.ok || res.status === 303) {
		return;
	}

	if (res.status === 424) {
		throw new Error('Failed to send verification email. Please try again.');
	}

	const text = await res.text().catch(() => '');
	throw new Error(text || `Registration failed (${res.status})`);
}

/**
 * Refresh auth token using refresh token.
 */
export async function trailbaseRefresh(
	refreshToken: string
): Promise<{ auth_token: string; csrf_token: string }> {
	const res = await fetch(`${TRAILBASE_URL}/api/auth/v1/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refresh_token: refreshToken })
	});

	if (!res.ok) {
		throw new Error('Session expired');
	}

	return await res.json();
}

/**
 * Logout: invalidate the specific session for the given refresh token.
 */
export async function trailbaseLogout(refreshToken: string): Promise<void> {
	await fetch(`${TRAILBASE_URL}/api/auth/v1/logout`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refresh_token: refreshToken })
	});
}

/** Cookie names for auth tokens */
export const AUTH_COOKIE = 'tb_auth_token';
export const REFRESH_COOKIE = 'tb_refresh_token';
export const CSRF_COOKIE = 'tb_csrf_token';

/** Cookie options for auth tokens */
const COOKIE_BASE = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const
};

export function setAuthCookies(
	cookies: Cookies,
	tokens: TrailBaseTokens,
	secure: boolean
) {
	cookies.set(AUTH_COOKIE, tokens.auth_token, {
		...COOKIE_BASE,
		secure,
		maxAge: 60 * 60 // 1 hour (auth token TTL)
	});
	cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
		...COOKIE_BASE,
		secure,
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
	cookies.set(CSRF_COOKIE, tokens.csrf_token, {
		...COOKIE_BASE,
		secure,
		httpOnly: false, // CSRF token needs to be readable by JS
		maxAge: 60 * 60 // 1 hour
	});
}

export function clearAuthCookies(cookies: Cookies) {
	cookies.delete(AUTH_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });
	cookies.delete(CSRF_COOKIE, { path: '/' });
}
