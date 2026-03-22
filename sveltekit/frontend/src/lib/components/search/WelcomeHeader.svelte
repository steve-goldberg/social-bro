<script lang="ts">
	const TEXT = 'Social Bro';
	const letters = TEXT.split('');

	let hoveredIndex = $state<number | null>(null);

	function getScale(index: number): number {
		if (hoveredIndex === null) return 1;
		const distance = Math.abs(index - hoveredIndex);
		return Math.max(1, 1.4 - distance * 0.15);
	}

	function getTranslateY(index: number): number {
		if (hoveredIndex === null) return 0;
		const distance = Math.abs(index - hoveredIndex);
		return Math.min(0, -8 + distance * 3);
	}
</script>

<div class="flex flex-col items-center gap-2 px-4 text-center sm:gap-3">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<h1
		class="flex text-2xl font-medium text-white font-doto sm:text-3xl md:text-4xl"
		onmouseleave={() => (hoveredIndex = null)}
	>
		{#each letters as char, index (index)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				class="inline-block transition-transform duration-150 ease-out"
				style:transform="scale({getScale(index)}) translateY({getTranslateY(index)}px)"
				onmouseenter={() => (hoveredIndex = index)}
			>
				{char === ' ' ? '\u00A0' : char}
			</span>
		{/each}
	</h1>
</div>
