<script lang="ts">
	import { Progress } from '$lib/components/ui/progress/index.js';

	interface Props {
		status: string;
		subtitle?: string;
		progress?: {
			current: number;
			total: number;
		};
	}

	let { status, subtitle, progress }: Props = $props();

	// Animated dots
	let dots = $state('');
	let dotsInterval: ReturnType<typeof setInterval>;

	$effect(() => {
		dotsInterval = setInterval(() => {
			dots = dots.length >= 3 ? '' : dots + '.';
		}, 400);
		return () => clearInterval(dotsInterval);
	});

	let progressPercent = $derived(progress ? (progress.current / progress.total) * 100 : 0);

	const particles = [
		{ top: '25%', left: '30%' },
		{ top: '40%', left: '70%' },
		{ top: '60%', left: '25%' },
		{ top: '35%', left: '55%' },
		{ top: '70%', left: '65%' },
		{ top: '50%', left: '40%' }
	];
</script>

<div
	class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
>
	<!-- Animated background gradient orbs -->
	<div class="absolute inset-0 overflow-hidden">
		<div
			class="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-[100px]"
		></div>
		<div
			class="absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse rounded-full bg-blue-500/10 blur-[100px]"
			style="animation-delay: 1s"
		></div>
		<div
			class="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/5 blur-[80px]"
			style="animation-delay: 0.5s"
		></div>
	</div>

	<!-- Main loader container -->
	<div class="relative flex flex-col items-center">
		<!-- Animated rings -->
		<div class="relative h-32 w-32 sm:h-40 sm:w-40">
			<!-- Outer ring - slow rotation -->
			<div class="loader-ring absolute inset-0 rounded-full border border-white/10">
				<div
					class="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
				></div>
			</div>

			<!-- Middle ring - medium rotation opposite -->
			<div class="loader-ring-reverse absolute inset-4 rounded-full border border-white/20">
				<div
					class="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
				></div>
			</div>

			<!-- Inner ring - fast rotation -->
			<div class="loader-ring-fast absolute inset-8 rounded-full border border-white/30">
				<div
					class="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
				></div>
			</div>

			<!-- Center pulsing core -->
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="relative">
					<div
						class="absolute inset-0 animate-ping rounded-full bg-purple-500/30"
						style="animation-duration: 2s"
					></div>
					<div
						class="relative h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-[0_0_30px_rgba(168,85,247,0.5)] sm:h-10 sm:w-10"
					></div>
				</div>
			</div>

			<!-- Scanning line effect -->
			<div class="loader-scan absolute inset-0 overflow-hidden rounded-full">
				<div
					class="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"
				></div>
			</div>
		</div>

		<!-- Status text -->
		<div class="mt-8 text-center sm:mt-10">
			<p class="text-base font-medium text-white sm:text-lg">
				{status}<span class="inline-block w-6 text-left">{dots}</span>
			</p>
			{#if subtitle}
				<p class="mt-2 text-sm text-white/50">{subtitle}</p>
			{/if}

			<!-- Progress bar -->
			{#if progress}
				<div class="mt-6 flex flex-col items-center gap-3">
					<div class="relative w-64 sm:w-80">
						<Progress value={progressPercent} max={100} class="h-2 bg-white/[0.08]" />

						<!-- Glowing dot at progress end -->
						<div
							class="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
							style:left="calc({progressPercent}% - 6px)"
							style:opacity={progressPercent > 0 ? 1 : 0}
						>
							<div class="relative">
								<div
									class="absolute -inset-2 animate-pulse rounded-full bg-purple-500/50 blur-md"
								></div>
								<div
									class="relative h-3 w-3 rounded-full bg-white shadow-[0_0_12px_rgba(168,85,247,1),0_0_24px_rgba(59,130,246,0.8)]"
								></div>
							</div>
						</div>
					</div>

					<!-- Progress text -->
					<div class="flex items-center gap-2">
						<div class="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"></div>
						<span class="font-mono text-xs tabular-nums text-white/60">
							{Math.round(progressPercent)}%
						</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Floating particles -->
		<div class="pointer-events-none absolute inset-0">
			{#each particles as pos, i (i)}
				<div
					class="loader-particle absolute h-1 w-1 rounded-full bg-white/30"
					style:top={pos.top}
					style:left={pos.left}
					style:animation-duration="{3 + i * 0.5}s"
					style:animation-delay="{i * 0.3}s"
				></div>
			{/each}
		</div>
	</div>

	<!-- Bottom hint -->
	<p class="absolute bottom-8 text-xs text-white/30">
		This may take a while for longer transcripts
	</p>
</div>

<style>
	.loader-ring {
		animation: spin 8s linear infinite;
	}
	.loader-ring-reverse {
		animation: spin 5s linear infinite reverse;
	}
	.loader-ring-fast {
		animation: spin 3s linear infinite;
	}
	.loader-scan {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.loader-particle {
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0) scale(1);
			opacity: 0.3;
		}
		50% {
			transform: translateY(-20px) scale(1.5);
			opacity: 0.6;
		}
	}
</style>
