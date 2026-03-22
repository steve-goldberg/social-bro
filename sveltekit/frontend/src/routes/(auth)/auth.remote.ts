import * as v from 'valibot';
import { redirect, invalid } from '@sveltejs/kit';
import { form } from '$app/server';
import { getRequestEvent } from '$app/server';
import {
	trailbaseLogin,
	trailbaseRegister,
	trailbaseLogout,
	setAuthCookies,
	clearAuthCookies,
	REFRESH_COOKIE
} from '$lib/server/auth.js';

export const loginForm = form(
	v.object({
		email: v.pipe(v.string(), v.nonEmpty('Please enter your email.'), v.email('Invalid email.')),
		_password: v.pipe(v.string(), v.nonEmpty('Please enter your password.'))
	}),
	async ({ email, _password }) => {
		const { cookies, url } = getRequestEvent();

		try {
			const tokens = await trailbaseLogin(email, _password);
			const secure = url.protocol === 'https:';
			setAuthCookies(cookies, tokens, secure);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Login failed';
			invalid(message);
		}

		redirect(303, '/');
	}
);

export const registerForm = form(
	v.object({
		email: v.pipe(v.string(), v.nonEmpty('Please enter your email.'), v.email('Invalid email.')),
		_password: v.pipe(
			v.string(),
			v.minLength(8, 'Password must be at least 8 characters.')
		),
		_passwordConfirm: v.pipe(v.string(), v.nonEmpty('Please confirm your password.'))
	}),
	async ({ email, _password, _passwordConfirm }, issue) => {
		if (_password !== _passwordConfirm) {
			invalid(issue._passwordConfirm('Passwords do not match.'));
		}

		try {
			await trailbaseRegister(email, _password, _passwordConfirm);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Registration failed';
			invalid(message);
		}

		const emailParam = encodeURIComponent(email);
		redirect(303, `/verify-email?email=${emailParam}`);
	}
);

export const logoutForm = form(v.object({}), async () => {
	const { cookies } = getRequestEvent();
	const refreshToken = cookies.get(REFRESH_COOKIE);
	if (refreshToken) {
		await trailbaseLogout(refreshToken).catch(() => {});
	}
	clearAuthCookies(cookies);
	redirect(303, '/login');
});
