<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import Mail from 'lucide-svelte/icons/mail';
	import Lock from 'lucide-svelte/icons/lock';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');

	let isValid = $derived(email.length > 0 && password.length > 0);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';

		if (!isValid) {
			errorMessage = 'Please fill in all fields';
			return;
		}

		isLoading = true;

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!response.ok) {
				const data = await response.json();
				errorMessage = data.error || 'Invalid email or password';
				isLoading = false;
				return;
			}

			await goto(resolve('/'));
		} catch {
			errorMessage = 'Something went wrong';
			isLoading = false;
		}
	}
</script>

<Card class="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-sm">
	<CardHeader class="text-center">
		<CardTitle class="text-xl font-medium text-white">Sign in</CardTitle>
	</CardHeader>
	<CardContent>
		<form onsubmit={handleSubmit} class="space-y-4">
			{#if errorMessage}
				<div class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
					{errorMessage}
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="email" class="text-xs font-medium text-white/60">Email</Label>
				<div class="relative">
					<Mail
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
					/>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						disabled={isLoading}
						required
						bind:value={email}
						class={cn(
							'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
							'text-white placeholder:text-white/30',
							'focus:border-white/20 focus:ring-1 focus:ring-white/10',
							'transition-colors duration-200',
							'disabled:opacity-50'
						)}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="password" class="text-xs font-medium text-white/60">Password</Label>
				<div class="relative">
					<Lock
						class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
					/>
					<Input
						id="password"
						type="password"
						placeholder="Your password"
						disabled={isLoading}
						required
						bind:value={password}
						class={cn(
							'rounded-xl border-white/10 bg-[#1a1a1a] py-3 pl-10 pr-4',
							'text-white placeholder:text-white/30',
							'focus:border-white/20 focus:ring-1 focus:ring-white/10',
							'transition-colors duration-200',
							'disabled:opacity-50'
						)}
					/>
				</div>
			</div>

			<Button
				type="submit"
				disabled={isLoading || !isValid}
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
				{#if isLoading}
					<LoaderCircle class="h-4 w-4 animate-spin" />
					Signing in...
				{:else}
					Sign in
				{/if}
			</Button>
		</form>
	</CardContent>
</Card>
