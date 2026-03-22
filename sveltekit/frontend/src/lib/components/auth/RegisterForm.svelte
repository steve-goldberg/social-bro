<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import {
		registerSchema,
		type RegisterSchema
	} from '../../../routes/(auth)/register/schema.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Mail from '@lucide/svelte/icons/mail';
	import Lock from '@lucide/svelte/icons/lock';

	interface Props {
		data: { form: SuperValidated<Infer<RegisterSchema>> };
		error?: string;
	}

	let { data, error }: Props = $props();

	const form = superForm(data.form, {
		validators: zod4Client(registerSchema)
	});

	const { form: formData, enhance, submitting } = form;
</script>

<Card class="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-sm">
	<CardHeader class="text-center">
		<CardTitle class="text-xl font-medium text-white">Create account</CardTitle>
	</CardHeader>
	<CardContent>
		<form method="POST" use:enhance class="space-y-4">
			{#if error}
				<div
					class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400"
				>
					{error}
				</div>
			{/if}

			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-xs font-medium text-white/60">Email</Form.Label>
						<div class="relative">
							<Mail
								class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
							/>
							<Input
								{...props}
								type="email"
								placeholder="you@example.com"
								disabled={$submitting}
								bind:value={$formData.email}
								class={cn(
									'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
									'text-white placeholder:text-white/30',
									'focus:border-white/20 focus:ring-1 focus:ring-white/10',
									'transition-colors duration-200',
									'disabled:opacity-50'
								)}
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-xs text-red-400" />
			</Form.Field>

			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-xs font-medium text-white/60">Password</Form.Label>
						<div class="relative">
							<Lock
								class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
							/>
							<Input
								{...props}
								type="password"
								placeholder="At least 8 characters"
								disabled={$submitting}
								bind:value={$formData.password}
								class={cn(
									'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
									'text-white placeholder:text-white/30',
									'focus:border-white/20 focus:ring-1 focus:ring-white/10',
									'transition-colors duration-200',
									'disabled:opacity-50'
								)}
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-xs text-red-400" />
			</Form.Field>

			<Form.Field {form} name="passwordConfirm">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-xs font-medium text-white/60"
							>Confirm password</Form.Label
						>
						<div class="relative">
							<Lock
								class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
							/>
							<Input
								{...props}
								type="password"
								placeholder="Repeat your password"
								disabled={$submitting}
								bind:value={$formData.passwordConfirm}
								class={cn(
									'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
									'text-white placeholder:text-white/30',
									'focus:border-white/20 focus:ring-1 focus:ring-white/10',
									'transition-colors duration-200',
									'disabled:opacity-50'
								)}
							/>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-xs text-red-400" />
			</Form.Field>

			<Button
				type="submit"
				disabled={$submitting}
				class={cn(
					'w-full rounded-xl border border-white/20 bg-[#2a2a2a] py-3 px-4',
					'text-sm font-medium text-white',
					'hover:bg-[#3a3a3a] hover:border-white/30',
					'focus:ring-2 focus:ring-white/20',
					'transition-all duration-200',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					'flex items-center justify-center gap-2'
				)}
			>
				{#if $submitting}
					<LoaderCircle class="h-4 w-4 animate-spin" />
					Creating account...
				{:else}
					Create account
				{/if}
			</Button>

			<p class="text-center text-xs text-white/40">
				Already have an account?
				<a href={resolve('/login')} class="text-white/70 underline hover:text-white">Sign in</a>
			</p>
		</form>
	</CardContent>
</Card>
