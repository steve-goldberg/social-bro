<script lang="ts">
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group/index.js';
	import type { Platform, PlatformConfig } from '$lib/types';
	import { PLATFORMS } from '$lib/constants';
	import Youtube from 'lucide-svelte/icons/youtube';
	import Instagram from 'lucide-svelte/icons/instagram';
	import Music2 from 'lucide-svelte/icons/music-2';
	import Settings2 from 'lucide-svelte/icons/settings-2';

	interface Props {
		selected: Platform;
		onselect: (platform: Platform) => void;
	}

	let { selected, onselect }: Props = $props();

	let isConfigOpen = $state(false);

	let isYouTubeSelected = $derived(selected === 'youtube');

	const platformIcons: Record<Platform, typeof Youtube> = {
		youtube: Youtube,
		instagram: Instagram,
		tiktok: Music2,
	};

	const platformGradients: Record<Platform, string> = {
		youtube: 'from-red-500 to-red-600',
		instagram: 'from-purple-500 via-pink-500 to-orange-400',
		tiktok: 'from-cyan-400 to-teal-500',
	};

	function handleValueChange(value: string | string[] | undefined) {
		if (value && typeof value === 'string') {
			onselect(value as Platform);
		}
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each PLATFORMS as platform (platform.id)}
		{@const Icon = platformIcons[platform.id]}
		{@const isSelected = selected === platform.id}
		<div class="flex items-center">
			<button
				onclick={() => onselect(platform.id)}
				class="flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm font-medium transition-all duration-150 active:scale-95 {isSelected
					? 'bg-white text-black'
					: 'border border-white/10 bg-transparent text-white/60 hover:border-white/20 hover:text-white'}"
			>
				<Icon class="h-4 w-4" />
				<span>{platform.name}</span>
			</button>

			{#if platform.id === 'youtube'}
				<div
					class="grid transition-all duration-200 ease-out"
					style="grid-template-columns: {isYouTubeSelected ? '1fr' : '0fr'};"
				>
					<div class="overflow-hidden">
						<button
							onclick={() => (isConfigOpen = true)}
							class="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-all hover:bg-white/15 hover:border-white/30 hover:text-white"
							title="YouTube search settings"
						>
							<Settings2 class="h-4 w-4" />
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>
