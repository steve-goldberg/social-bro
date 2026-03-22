<script lang="ts">
	import { fade } from 'svelte/transition';

	interface Props {
		onComplete?: () => void;
		duration?: number;
	}

	let { onComplete, duration = 2000 }: Props = $props();

	const TEXT = 'Social Bro';
	const letters = TEXT.split('');

	let isFadingOut = $state(false);
	let animatedIndex = $state(-2);

	function getScale(index: number): number {
		if (animatedIndex < 0) return 1;
		const distance = Math.abs(index - animatedIndex);
		return Math.max(1, 1.4 - distance * 0.15);
	}

	function getTranslateY(index: number): number {
		if (animatedIndex < 0) return 0;
		const distance = Math.abs(index - animatedIndex);
		return Math.min(0, -8 + distance * 3);
	}

	$effect(() => {
		// Start animation after a brief delay
		const startDelay = setTimeout(() => {
			animatedIndex = 0;
		}, 300);

		return () => clearTimeout(startDelay);
	});

	$effect(() => {
		if (animatedIndex < 0) return;

		// Animate through each character
		if (animatedIndex < TEXT.length + 2) {
			const timer = setTimeout(() => {
				animatedIndex += 1;
			}, 80);
			return () => clearTimeout(timer);
		}
	});

	$effect(() => {
		const timer = setTimeout(() => {
			isFadingOut = true;
			setTimeout(() => {
				onComplete?.();
			}, 500);
		}, duration);

		return () => clearTimeout(timer);
	});
</script>

{#if !isFadingOut}
	<div
		class="fixed inset-0 z-[99999] flex items-center justify-center bg-black"
		out:fade={{ duration: 500 }}
	>
		<h1
			class="flex text-3xl font-medium text-white font-doto sm:text-4xl md:text-5xl lg:text-6xl"
		>
			{#each letters as char, index (index)}
				<span
					class="inline-block transition-transform duration-150 ease-out"
					style:transform="scale({getScale(index)}) translateY({getTranslateY(index)}px)"
				>
					{char === ' ' ? '\u00A0' : char}
				</span>
			{/each}
		</h1>
	</div>
{/if}
