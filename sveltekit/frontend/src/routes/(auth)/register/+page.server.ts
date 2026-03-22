import type { Actions, PageServerLoad } from './$types.js';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { registerSchema } from './schema.js';
import { trailbaseRegister } from '$lib/server/auth.js';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(registerSchema))
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(registerSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await trailbaseRegister(
				form.data.email,
				form.data.password,
				form.data.passwordConfirm
			);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Registration failed';
			return fail(400, {
				form,
				error: message
			});
		}

		const emailParam = encodeURIComponent(form.data.email);
		redirect(303, `/verify-email?email=${emailParam}`);
	}
};
