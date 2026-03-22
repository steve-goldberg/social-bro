import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { loginSchema } from './schema.js';
import { trailbaseLogin, setAuthCookies } from '$lib/server/auth.js';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(loginSchema))
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(loginSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const tokens = await trailbaseLogin(form.data.email, form.data.password);
			const secure = url.protocol === 'https:';
			setAuthCookies(cookies, tokens, secure);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Login failed';
			return fail(401, {
				form,
				error: message
			});
		}

		redirect(303, '/');
	}
};
