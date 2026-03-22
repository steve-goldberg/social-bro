<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import Check from '@lucide/svelte/icons/check';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(false), onClose: _onClose }: Props = $props();

	interface ConfigState {
		maxResults: number;
		dateRange: string;
		region: string;
		videoDuration: string;
		order: string;
	}

	const DATE_RANGE_OPTIONS = [
		{ value: 'any', label: 'Any time' },
		{ value: 'day', label: 'Last 24 hours' },
		{ value: 'week', label: 'Last week' },
		{ value: 'month', label: 'Last month' }
	];

	const VIDEO_DURATION_OPTIONS = [
		{ value: 'any', label: 'Any duration' },
		{ value: 'short', label: 'Shorts (< 4 min)' },
		{ value: 'medium', label: 'Medium (4-20 min)' },
		{ value: 'long', label: 'Long (> 20 min)' }
	];

	const ORDER_OPTIONS = [
		{ value: 'relevance', label: 'Relevance' },
		{ value: 'date', label: 'Upload date' },
		{ value: 'viewCount', label: 'View count' },
		{ value: 'rating', label: 'Rating' }
	];

	const REGION_OPTIONS = [
		{ value: 'US', label: 'United States' },
		{ value: 'GB', label: 'United Kingdom' },
		{ value: 'CA', label: 'Canada' },
		{ value: 'AU', label: 'Australia' },
		{ value: 'DE', label: 'Germany' },
		{ value: 'FR', label: 'France' },
		{ value: 'JP', label: 'Japan' },
		{ value: 'KR', label: 'South Korea' },
		{ value: 'IN', label: 'India' },
		{ value: 'BR', label: 'Brazil' },
		{ value: 'MX', label: 'Mexico' },
		{ value: 'ES', label: 'Spain' },
		{ value: 'IT', label: 'Italy' },
		{ value: 'NL', label: 'Netherlands' },
		{ value: 'PL', label: 'Poland' },
		{ value: 'SE', label: 'Sweden' },
		{ value: 'NO', label: 'Norway' },
		{ value: 'DK', label: 'Denmark' },
		{ value: 'FI', label: 'Finland' },
		{ value: 'SG', label: 'Singapore' }
	];

	const MAX_RESULTS_OPTIONS = [10, 15, 20, 25, 30, 40, 50];

	const DEFAULT_CONFIG: ConfigState = {
		maxResults: 25,
		dateRange: 'any',
		region: 'US',
		videoDuration: 'any',
		order: 'relevance'
	};

	let config = $state<ConfigState>({ ...DEFAULT_CONFIG });
	let savedConfig = $state<ConfigState>({ ...DEFAULT_CONFIG });
	let isLoading = $state(true);
	let isSaving = $state(false);

	let hasChanges = $derived(
		config.maxResults !== savedConfig.maxResults ||
			config.dateRange !== savedConfig.dateRange ||
			config.region !== savedConfig.region ||
			config.videoDuration !== savedConfig.videoDuration ||
			config.order !== savedConfig.order
	);

	$effect(() => {
		if (open) {
			fetchConfig();
		}
	});

	async function fetchConfig() {
		isLoading = true;
		try {
			const response = await fetch('/api/youtube/config');
			if (response.ok) {
				const data = await response.json();
				config = { ...data };
				savedConfig = { ...data };
			}
		} catch (error) {
			console.error('Failed to fetch YouTube config:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		isSaving = true;
		try {
			const response = await fetch('/api/youtube/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});
			if (response.ok) {
				const data = await response.json();
				savedConfig = { ...data };
			}
		} catch (error) {
			console.error('Failed to save YouTube config:', error);
		} finally {
			isSaving = false;
		}
	}

	function getLabel(options: { value: string; label: string }[], value: string): string {
		return options.find((o) => o.value === value)?.label ?? value;
	}
</script>

<Dialog bind:open>
	<DialogContent
		class="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-black/90 p-4 shadow-2xl sm:w-full sm:rounded-2xl sm:p-6"
	>
		<DialogHeader class="mb-4 sm:mb-6">
			<DialogTitle class="text-sm font-medium text-white sm:text-lg"
				>YouTube Search Settings</DialogTitle
			>
			<DialogDescription class="sr-only">Configure YouTube search parameters</DialogDescription>
		</DialogHeader>

		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<Spinner class="h-5 w-5 text-white/40" />
			</div>
		{:else}
			<div class="space-y-4 sm:space-y-5">
				<!-- Results per search -->
				<div>
					<label
						class="mb-2 block text-xs font-medium text-white/70 sm:mb-2.5 sm:text-sm"
					>
						Results per search
					</label>
					<div class="flex flex-wrap gap-1.5 sm:gap-2">
						{#each MAX_RESULTS_OPTIONS as num}
							<button
								class="min-h-[40px] min-w-[40px] flex-1 rounded-lg text-xs font-medium transition-all active:scale-95 sm:text-sm {config.maxResults ===
								num
									? 'bg-white text-black'
									: 'border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80'}"
								onclick={() => (config.maxResults = num)}
							>
								{num}
							</button>
						{/each}
					</div>
				</div>

				<!-- Dropdowns grid -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4">
					<!-- Date Range -->
					<div>
						<label
							class="mb-1.5 block text-xs font-medium text-white/70 sm:mb-2 sm:text-sm"
						>
							Date Range
						</label>
						<Select
							type="single"
							value={config.dateRange}
							onValueChange={(v) => {
								if (v) config.dateRange = v;
							}}
						>
							<SelectTrigger
								class="min-h-[44px] w-full rounded-lg border border-white/20 bg-white/[0.05] text-xs text-white sm:text-sm"
							>
								{getLabel(DATE_RANGE_OPTIONS, config.dateRange)}
							</SelectTrigger>
							<SelectContent>
								{#each DATE_RANGE_OPTIONS as option}
									<SelectItem value={option.value}>{option.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>

					<!-- Duration -->
					<div>
						<label
							class="mb-1.5 block text-xs font-medium text-white/70 sm:mb-2 sm:text-sm"
						>
							Duration
						</label>
						<Select
							type="single"
							value={config.videoDuration}
							onValueChange={(v) => {
								if (v) config.videoDuration = v;
							}}
						>
							<SelectTrigger
								class="min-h-[44px] w-full rounded-lg border border-white/20 bg-white/[0.05] text-xs text-white sm:text-sm"
							>
								{getLabel(VIDEO_DURATION_OPTIONS, config.videoDuration)}
							</SelectTrigger>
							<SelectContent>
								{#each VIDEO_DURATION_OPTIONS as option}
									<SelectItem value={option.value}>{option.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>

					<!-- Sort By -->
					<div>
						<label
							class="mb-1.5 block text-xs font-medium text-white/70 sm:mb-2 sm:text-sm"
						>
							Sort By
						</label>
						<Select
							type="single"
							value={config.order}
							onValueChange={(v) => {
								if (v) config.order = v;
							}}
						>
							<SelectTrigger
								class="min-h-[44px] w-full rounded-lg border border-white/20 bg-white/[0.05] text-xs text-white sm:text-sm"
							>
								{getLabel(ORDER_OPTIONS, config.order)}
							</SelectTrigger>
							<SelectContent>
								{#each ORDER_OPTIONS as option}
									<SelectItem value={option.value}>{option.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>

					<!-- Region -->
					<div>
						<label
							class="mb-1.5 block text-xs font-medium text-white/70 sm:mb-2 sm:text-sm"
						>
							Region
						</label>
						<Select
							type="single"
							value={config.region}
							onValueChange={(v) => {
								if (v) config.region = v;
							}}
						>
							<SelectTrigger
								class="min-h-[44px] w-full rounded-lg border border-white/20 bg-white/[0.05] text-xs text-white sm:text-sm"
							>
								{getLabel(REGION_OPTIONS, config.region)}
							</SelectTrigger>
							<SelectContent>
								{#each REGION_OPTIONS as option}
									<SelectItem value={option.value}>{option.label}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				</div>

				<!-- Save Button -->
				<div class="flex justify-end pt-1">
					<Button
						class="min-h-[44px]"
						disabled={!hasChanges || isSaving}
						onclick={handleSave}
					>
						{#if isSaving}
							<Spinner class="mr-2 h-4 w-4" />
							Saving...
						{:else}
							<Check class="mr-2 h-4 w-4" />
							Save
						{/if}
					</Button>
				</div>
			</div>
		{/if}
	</DialogContent>
</Dialog>
