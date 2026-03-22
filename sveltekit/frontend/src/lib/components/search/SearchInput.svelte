<script lang="ts">
	import type { Platform } from '$lib/types';
	import Search from '@lucide/svelte/icons/search';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import AtSign from '@lucide/svelte/icons/at-sign';
	import Link from '@lucide/svelte/icons/link';

	interface Props {
		value: string;
		onchange: (value: string) => void;
		onsearch: () => void;
		onrepurpose?: (url: string) => void;
		placeholder?: string;
		disabled?: boolean;
		isLoading?: boolean;
		platform?: Platform;
	}

	let {
		value,
		onchange,
		onsearch,
		onrepurpose,
		placeholder = 'Search for content...',
		disabled = false,
		isLoading = false,
		platform = 'youtube',
	}: Props = $props();

	let inputRef: HTMLInputElement | undefined = $state();

	let canSearch = $derived(value.trim().length > 0 && !disabled && !isLoading);

	let isChannelMode = $derived(value.trim().startsWith('@'));

	let isUrlMode = $derived(platform === 'youtube' && isYouTubeUrl(value));

	let modeLabel = $derived(platform === 'youtube' ? 'Channel Mode' : 'Username Mode');
	let buttonLabel = $derived(platform === 'youtube' ? 'Get Channel' : 'Get Username');
	let helperLabel = $derived(platform === 'youtube' ? 'channel' : 'username');

	let isSpecialMode = $derived(isChannelMode || isUrlMode);
	let currentModeLabel = $derived(isUrlMode ? 'Repurpose Mode' : modeLabel);

	function isYouTubeUrl(text: string): boolean {
		const trimmed = text.trim();
		const patterns = [
			/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)/i,
			/^(youtube\.com|youtu\.be)/i,
		];
		return patterns.some((p) => p.test(trimmed));
	}

	function handleAction() {
		if (isUrlMode && onrepurpose) {
			onrepurpose(value.trim());
		} else {
			onsearch();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canSearch) {
			e.preventDefault();
			handleAction();
		}
	}
</script>

<div class="w-full">
	<!-- Mode indicator -->
	<div class="mb-2 sm:mb-3 flex h-3 justify-center">
		<span
			class="uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] font-medium transition-opacity duration-200 {isSpecialMode
				? 'text-white/50 opacity-100'
				: 'opacity-0'} {isUrlMode ? 'text-purple-400/70' : ''}"
		>
			{currentModeLabel}
		</span>
	</div>

	<div
		class="w-full rounded-xl sm:rounded-2xl border transition-all duration-300 {isUrlMode
			? 'border-purple-500/30 bg-purple-500/[0.08]'
			: isChannelMode
				? 'border-white/30 bg-white/[0.08]'
				: 'border-white/10 bg-white/[0.03] hover:border-white/20'}"
	>
		<div class="flex h-12 sm:h-14 items-center gap-3 sm:gap-4 px-3 sm:px-5">
			{#if isLoading}
				<Loader2 class="h-4 w-4 shrink-0 animate-spin text-white/40" />
			{:else if isUrlMode}
				<Link class="h-4 w-4 shrink-0 text-purple-400/70" />
			{:else if isChannelMode}
				<AtSign class="h-4 w-4 shrink-0 text-white/70" />
			{:else}
				<Search class="h-4 w-4 shrink-0 text-white/30" />
			{/if}

			<input
				bind:this={inputRef}
				type="text"
				{value}
				oninput={(e) => onchange(e.currentTarget.value)}
				onkeydown={handleKeydown}
				{placeholder}
				disabled={disabled || isLoading}
				class="min-w-0 flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 focus:outline-none disabled:opacity-50"
			/>

			{#if canSearch}
				<button
					onclick={handleAction}
					class="shrink-0 rounded-lg sm:rounded-xl border px-3 sm:px-5 py-2 min-h-[36px] sm:min-h-[auto] text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-200 active:scale-95 {isUrlMode
						? 'border-purple-500/40 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
						: isChannelMode
							? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
							: 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'}"
				>
					{isUrlMode ? 'Repurpose' : isChannelMode ? buttonLabel : 'Search'}
				</button>
			{/if}
		</div>
	</div>

	<!-- Helper text -->
	<div class="mt-3 sm:mt-4 mb-6 sm:mb-8 flex justify-center">
		<p
			class="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white/25"
		>
			{#if isUrlMode}
				<span class="text-purple-400/50">Extract transcript & repurpose instantly</span>
			{:else if isChannelMode}
				<span class="text-white/40">@{value.trim().slice(1) || '...'}</span>
			{:else}
				<span>
					Use <span class="text-white/40">@username</span> for {helperLabel}
					{#if platform === 'youtube'}
						 or <span class="text-purple-400/40">paste a URL</span> to repurpose
					{/if}
				</span>
			{/if}
		</p>
	</div>
</div>
