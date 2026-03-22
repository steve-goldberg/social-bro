import { z } from 'zod';

export const registerSchema = z
	.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		passwordConfirm: z.string().min(1, 'Please confirm your password')
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords do not match',
		path: ['passwordConfirm']
	});

export type RegisterSchema = typeof registerSchema;
