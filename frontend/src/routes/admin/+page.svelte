<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Users from '@lucide/svelte/icons/users';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	interface User {
		id: string;
		email: string;
		name: string | null;
		status: 'active' | 'pending';
		invitedAt: string;
		createdAt: string | null;
	}

	let email = $state('');
	let adminSecret = $state('');
	let isSubmitting = $state(false);
	let isVerifying = $state(false);
	let isVerified = $state(false);
	let users = $state<User[]>([]);
	let isLoading = $state(false);
	let inviteLink = $state('');
	let copied = $state(false);

	async function fetchUsers(secret: string): Promise<boolean> {
		if (!secret) return false;
		isLoading = true;
		try {
			const res = await fetch('/api/admin/invite', {
				headers: { Authorization: `Bearer ${secret}` }
			});
			const data = await res.json();
			if (res.ok) {
				users = data.users;
				return true;
			} else {
				toast.error(data.error || 'Invalid admin secret');
				return false;
			}
		} catch {
			toast.error('Failed to verify admin secret');
			return false;
		} finally {
			isLoading = false;
		}
	}

	async function handleVerify(e: SubmitEvent) {
		e.preventDefault();
		if (!adminSecret) return;
		isVerifying = true;
		const success = await fetchUsers(adminSecret);
		isVerified = success;
		isVerifying = false;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email || !adminSecret) return;
		isSubmitting = true;
		inviteLink = '';

		try {
			const res = await fetch('/api/admin/invite', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${adminSecret}`
				},
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || 'Failed to invite user');
				return;
			}
			toast.success('User invited!');
			inviteLink = data.inviteUrl;
			email = '';
			fetchUsers(adminSecret);
		} catch {
			toast.error('Failed to invite user');
		} finally {
			isSubmitting = false;
		}
	}

	async function copyToClipboard() {
		await navigator.clipboard.writeText(inviteLink);
		copied = true;
		toast.success('Copied to clipboard');
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="min-h-screen p-8">
	<div class="mx-auto max-w-2xl space-y-8">
		<div>
			<h1 class="font-doto mb-2 text-3xl font-medium tracking-tight text-white">Admin Panel</h1>
			<p class="text-sm text-white/50">Invite users to the platform</p>
		</div>

		{#if !isVerified}
			<form onsubmit={handleVerify} class="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
				<label class="mb-2 block text-xs font-medium text-white/60">Admin Secret</label>
				<div class="flex gap-3">
					<input
						type="password"
						bind:value={adminSecret}
						placeholder="Enter admin secret to continue"
						disabled={isVerifying}
						class={cn(
							'flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3',
							'text-white placeholder:text-white/30',
							'focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10',
							'disabled:opacity-50'
						)}
					/>
					<button
						type="submit"
						disabled={isVerifying || !adminSecret}
						class={cn(
							'rounded-xl border border-white/20 bg-white/10 px-6 py-3',
							'text-sm font-medium text-white',
							'hover:border-white/30 hover:bg-white/20',
							'flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50'
						)}
					>
						{#if isVerifying}
							<Loader2 class="h-4 w-4 animate-spin" />
						{:else}
							Verify
						{/if}
					</button>
				</div>
			</form>
		{:else}
			<!-- Invite Form -->
			<div class="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
				<h2 class="mb-4 flex items-center gap-2 text-lg font-medium text-white">
					<UserPlus class="h-5 w-5" />
					Invite New User
				</h2>
				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<label class="mb-2 block text-xs font-medium text-white/60">Email Address</label>
						<input
							type="email"
							bind:value={email}
							placeholder="user@example.com"
							disabled={isSubmitting}
							required
							class={cn(
								'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3',
								'text-white placeholder:text-white/30',
								'focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10',
								'disabled:opacity-50'
							)}
						/>
					</div>
					<button
						type="submit"
						disabled={isSubmitting}
						class={cn(
							'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3',
							'text-sm font-medium text-white',
							'hover:border-white/30 hover:bg-white/20',
							'flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50'
						)}
					>
						{#if isSubmitting}
							<Loader2 class="h-4 w-4 animate-spin" />
							Inviting...
						{:else}
							<UserPlus class="h-4 w-4" />
							Send Invite
						{/if}
					</button>
				</form>

				{#if inviteLink}
					<div class="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
						<p class="mb-2 text-xs text-green-400">Invite link created:</p>
						<div class="flex items-center gap-2">
							<code class="flex-1 overflow-x-auto rounded bg-black/20 p-2 text-sm text-white/80">
								{inviteLink}
							</code>
							<button onclick={copyToClipboard} class="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20">
								{#if copied}
									<Check class="h-4 w-4 text-green-400" />
								{:else}
									<Copy class="h-4 w-4 text-white/60" />
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Users List -->
			<div class="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-lg font-medium text-white">
						<Users class="h-5 w-5" />
						Users ({users.length})
					</h2>
					<button
						onclick={() => fetchUsers(adminSecret)}
						disabled={isLoading}
						class={cn(
							'rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20',
							'disabled:cursor-not-allowed disabled:opacity-50'
						)}
						title="Refresh users"
					>
						<RefreshCw class={cn('h-4 w-4 text-white/60', isLoading && 'animate-spin')} />
					</button>
				</div>

				{#if isLoading}
					<div class="flex justify-center py-8">
						<Loader2 class="h-6 w-6 animate-spin text-white/50" />
					</div>
				{:else if users.length === 0}
					<p class="py-8 text-center text-white/40">No users yet</p>
				{:else}
					<div class="space-y-2">
						{#each users as user (user.id)}
							<div class="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3">
								<div>
									<p class="text-white">{user.email}</p>
									{#if user.name}
										<p class="text-xs text-white/40">{user.name}</p>
									{/if}
								</div>
								<span
									class={cn(
										'rounded-full px-2 py-1 text-xs',
										user.status === 'active'
											? 'bg-green-500/20 text-green-400'
											: 'bg-yellow-500/20 text-yellow-400'
									)}
								>
									{user.status}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
