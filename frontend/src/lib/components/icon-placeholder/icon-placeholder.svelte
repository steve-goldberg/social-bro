<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	let {
		name,
		lucide,
		class: className,
		// Accept and ignore other icon library props
		tabler: _tabler,
		phosphor: _phosphor,
		hugeicons: _hugeicons,
		remixicon: _remixicon,
		...restProps
	}: {
		name?: string | null;
		lucide?: string;
		class?: string;
		tabler?: string;
		phosphor?: string;
		hugeicons?: string;
		remixicon?: string;
		[key: string]: unknown;
	} & SVGAttributes<SVGSVGElement> = $props();

	// Convert PascalCase icon name to kebab-case for lucide import path
	// e.g. "ChevronDownIcon" -> "chevron-down"
	function toKebab(str: string): string {
		return str
			.replace(/Icon$/, '')
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
			.toLowerCase();
	}

	const iconName = $derived(name || (lucide ? toKebab(lucide) : ''));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let IconComponent: any = $state(null);

	$effect(() => {
		if (!iconName) return;
		import(`@lucide/svelte/icons/${iconName}`)
			.then((mod) => {
				IconComponent = mod.default;
			})
			.catch(() => {
				// Icon not found
			});
	});
</script>

{#if IconComponent}
	<IconComponent class={className} {...restProps} />
{/if}
