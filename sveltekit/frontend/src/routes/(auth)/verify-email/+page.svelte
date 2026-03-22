<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Mail from '@lucide/svelte/icons/mail';

	const email = $derived(page.url.searchParams.get('email') ?? '');
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-sm">
		<CardHeader class="text-center">
			<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
				<Mail class="h-6 w-6 text-white/70" />
			</div>
			<CardTitle class="text-xl font-medium text-white">Check your email</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4 text-center">
			<p class="text-sm text-white/60">
				We sent a verification link to
				{#if email}
					<span class="font-medium text-white/80">{email}</span>
				{:else}
					your email address
				{/if}.
			</p>
			<p class="text-sm text-white/60">
				Click the link in the email to verify your account, then sign in.
			</p>

			<div class="pt-2">
				<Button
					href={resolve('/login')}
					variant="outline"
					class="w-full rounded-xl border-white/20 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
				>
					Back to sign in
				</Button>
			</div>

			<p class="text-xs text-white/30">
				Didn't receive the email? Check your spam folder or try registering again.
			</p>
		</CardContent>
	</Card>
</div>
