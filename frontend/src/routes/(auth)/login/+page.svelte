<script lang="ts">
	import { resolve } from '$app/paths';
	import { loginForm } from '../auth.remote.js';
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
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-sm">
		<CardHeader class="text-center">
			<CardTitle class="text-xl font-medium text-white">Sign in</CardTitle>
		</CardHeader>
		<CardContent>
			<form {...loginForm} class="space-y-4">
				{#each loginForm.fields.allIssues() as issue (issue.message)}
					<div
						class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400"
					>
						{issue.message}
					</div>
				{/each}

				<div>
					<label class="text-xs font-medium text-white/60" for="login-email">Email</label>
					<div class="relative">
						<Mail
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
						/>
						<Input
							{...loginForm.fields.email.as('email')}
							id="login-email"
							placeholder="you@example.com"
							disabled={!!loginForm.pending}
							class={cn(
								'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
								'text-white placeholder:text-white/30',
								'focus:border-white/20 focus:ring-1 focus:ring-white/10',
								'transition-colors duration-200',
								'disabled:opacity-50'
							)}
						/>
					</div>
					{#each loginForm.fields.email.issues() as issue (issue.message)}
						<p class="mt-1 text-xs text-red-400">{issue.message}</p>
					{/each}
				</div>

				<div>
					<label class="text-xs font-medium text-white/60" for="login-password"
						>Password</label
					>
					<div class="relative">
						<Lock
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
						/>
						<Input
							{...loginForm.fields._password.as('password')}
							id="login-password"
							placeholder="Your password"
							disabled={!!loginForm.pending}
							class={cn(
								'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
								'text-white placeholder:text-white/30',
								'focus:border-white/20 focus:ring-1 focus:ring-white/10',
								'transition-colors duration-200',
								'disabled:opacity-50'
							)}
						/>
					</div>
					{#each loginForm.fields._password.issues() as issue (issue.message)}
						<p class="mt-1 text-xs text-red-400">{issue.message}</p>
					{/each}
				</div>

				<Button
					type="submit"
					disabled={!!loginForm.pending}
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
					{#if loginForm.pending}
						<LoaderCircle class="h-4 w-4 animate-spin" />
						Signing in...
					{:else}
						Sign in
					{/if}
				</Button>

				<p class="text-center text-xs text-white/40">
					Don't have an account?
					<a
						href={resolve('/register')}
						class="text-white/70 underline hover:text-white">Sign up</a
					>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
