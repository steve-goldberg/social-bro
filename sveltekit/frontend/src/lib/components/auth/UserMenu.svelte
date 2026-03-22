<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu/index.js';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';

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
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		<div class="flex cursor-pointer items-center gap-3">
			<span class="hidden text-xs font-medium text-white/50 sm:inline">{displayName}</span>
			<Avatar class="h-8 w-8">
				{#if avatarUrl}
					<AvatarImage src={avatarUrl} alt={displayName} />
				{/if}
				<AvatarFallback class="bg-white/10 text-xs font-medium text-white/70">
					{initials}
				</AvatarFallback>
			</Avatar>
		</div>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-48 border-white/10 bg-[#1a1a1a]">
		<form method="POST" action="/logout" use:enhance>
			<DropdownMenuItem
				class="cursor-pointer text-white/70 hover:text-white focus:text-white"
			>
				<button type="submit" class="flex w-full items-center">
					<LogOut class="mr-2 h-3.5 w-3.5" />
					Logout
				</button>
			</DropdownMenuItem>
		</form>
	</DropdownMenuContent>
</DropdownMenu>
