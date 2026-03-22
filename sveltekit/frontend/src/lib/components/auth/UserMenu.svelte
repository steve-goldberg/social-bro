<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu/index.js';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar/index.js';
	import LogOut from 'lucide-svelte/icons/log-out';

	interface Props {
		name?: string;
		email?: string;
		avatarUrl?: string;
	}

	let { name, email, avatarUrl }: Props = $props();

	let displayName = $derived(name || email?.split('@')[0] || 'User');
	let initials = $derived(
		displayName
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			await goto(resolve('/login'));
		} catch {
			await goto(resolve('/login'));
		}
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<div class="flex items-center gap-3 cursor-pointer">
			<span class="hidden text-xs font-medium text-white/50 sm:inline">{displayName}</span>
			<Avatar class="h-8 w-8">
				{#if avatarUrl}
					<AvatarImage src={avatarUrl} alt={displayName} />
				{/if}
				<AvatarFallback
					class="bg-white/10 text-xs font-medium text-white/70"
				>
					{initials}
				</AvatarFallback>
			</Avatar>
		</div>
	</DropdownMenuTrigger>
	<DropdownMenuContent
		align="end"
		class="w-48 border-white/10 bg-[#1a1a1a]"
	>
		<DropdownMenuItem
			onclick={handleLogout}
			class="cursor-pointer text-white/70 hover:text-white focus:text-white"
		>
			<LogOut class="mr-2 h-3.5 w-3.5" />
			Logout
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
