<!-- eslint-disable svelte/no-navigation-without-resolve -->
<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog/index.js';
	import {
		Accordion,
		AccordionItem,
		AccordionTrigger,
		AccordionContent
	} from '$lib/components/ui/accordion/index.js';
	import {
		AlertDialog,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogAction,
		AlertDialogCancel
	} from '$lib/components/ui/alert-dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import HelpCircle from '@lucide/svelte/icons/help-circle';

	type ApiKeyService = 'youtube' | 'rapidapi' | 'openrouter';

	interface ApiKeyState {
		service: ApiKeyService;
		maskedKey: string | null;
		hasKey: boolean;
	}

	interface LlmModel {
		id: string;
		modelId: string;
		name: string;
		provider: string;
		promptPrice: number;
		completionPrice: number;
		contextLength: number | null;
	}

	interface GuideStep {
		title: string;
		description: string;
		link?: { url: string; text: string };
	}

	interface GuideContent {
		title: string;
		description: string;
		steps: GuideStep[];
	}

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { open = $bindable(false), onClose }: Props = $props();

	const SERVICE_CONFIG: Record<ApiKeyService, { label: string; placeholder: string }> = {
		youtube: {
			label: 'YouTube API Key',
			placeholder: 'Enter your YouTube Data API v3 key'
		},
		rapidapi: {
			label: 'RapidAPI Key',
			placeholder: 'Enter your RapidAPI key'
		},
		openrouter: {
			label: 'OpenRouter API Key',
			placeholder: 'Enter your OpenRouter API key'
		}
	};

	const GUIDE_CONTENT: Record<ApiKeyService, GuideContent> = {
		youtube: {
			title: 'YouTube API Key Setup',
			description: 'Get a free YouTube Data API v3 key from Google Cloud Console.',
			steps: [
				{
					title: 'Go to Google Cloud Console',
					description:
						'Visit the Google Cloud Console and sign in with your Google account.',
					link: { url: 'https://console.cloud.google.com/', text: 'Open Console' }
				},
				{
					title: 'Create a new project',
					description:
						'Click "Select a project" at the top, then "New Project". Name it anything.'
				},
				{
					title: 'Enable YouTube Data API',
					description:
						'Go to "APIs & Services" > "Library". Search for "YouTube Data API v3".',
					link: {
						url: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
						text: 'Direct Link'
					}
				},
				{
					title: 'Create API credentials',
					description:
						'Go to "APIs & Services" > "Credentials". Click "Create Credentials" > "API Key".'
				},
				{
					title: 'Copy your API key',
					description:
						'Your new API key will be displayed. Copy and paste it into the field above.'
				}
			]
		},
		rapidapi: {
			title: 'RapidAPI Key Setup',
			description:
				'Get a RapidAPI key and subscribe to the required APIs (free tier available).',
			steps: [
				{
					title: 'Create a RapidAPI account',
					description: 'Sign up for a free RapidAPI account using email or social login.',
					link: { url: 'https://rapidapi.com/auth/sign-up', text: 'Sign Up' }
				},
				{
					title: 'Subscribe to Instagram API',
					description:
						'Visit the Instagram Looter2 API page and subscribe to the free plan.',
					link: {
						url: 'https://rapidapi.com/irrors-apis/api/instagram-looter2/',
						text: 'Instagram API'
					}
				},
				{
					title: 'Subscribe to TikTok API',
					description:
						'Visit the TikTok API23 page and subscribe to the free plan as well.',
					link: {
						url: 'https://rapidapi.com/Lundehund/api/tiktok-api23/',
						text: 'TikTok API'
					}
				},
				{
					title: 'Subscribe to Transcript API',
					description:
						'Visit the YouTube Transcript3 page and subscribe to the free plan.',
					link: {
						url: 'https://rapidapi.com/solid-api-solid-api-default/api/youtube-transcript3/',
						text: 'Transcript API'
					}
				},
				{
					title: 'Copy your API key',
					description:
						'On any API page, find "X-RapidAPI-Key" in code snippets. Copy and paste it.'
				}
			]
		},
		openrouter: {
			title: 'OpenRouter API Key Setup',
			description:
				'Get an OpenRouter API key to access various AI models for repurposing.',
			steps: [
				{
					title: 'Create an OpenRouter account',
					description:
						'Sign up for OpenRouter using your Google account or GitHub account.',
					link: { url: 'https://openrouter.ai/', text: 'Open Site' }
				},
				{
					title: 'Add credits to account',
					description:
						'Some models are free. For paid models, add credits starting with $5.'
				},
				{
					title: 'Go to API Keys page',
					description:
						'Click on "Keys" in the navigation menu to access the key management page.',
					link: { url: 'https://openrouter.ai/keys', text: 'Keys Page' }
				},
				{
					title: 'Generate a new API key',
					description:
						'Click "Create Key" and give it a name. The key will only be shown once.'
				},
				{
					title: 'Copy your API key',
					description:
						'Copy the generated key (starts with "sk-or-") and paste it into the field.'
				}
			]
		}
	};

	// State
	let apiKeys = $state<ApiKeyState[]>([]);
	let isLoading = $state(true);
	let editingService = $state<ApiKeyService | null>(null);
	let inputValue = $state('');
	let showKey = $state(false);
	let isSaving = $state(false);
	let isDeleting = $state<ApiKeyService | null>(null);
	let deleteConfirmService = $state<ApiKeyService | null>(null);

	// LLM Models state
	let llmModels = $state<LlmModel[]>([]);
	let selectedModelId = $state<string | null>(null);
	let isSyncing = $state(false);
	let isDropdownOpen = $state(false);
	let isSavingModel = $state(false);
	let modelSearch = $state('');

	// Guide state
	let activeGuide = $state<ApiKeyService | null>(null);

	// OpenRouter derived state
	let orKeyState = $derived(apiKeys.find((k) => k.service === 'openrouter'));
	const orConfig = SERVICE_CONFIG.openrouter;
	let orIsEditing = $derived(editingService === 'openrouter');

	let filteredModels = $derived(
		llmModels.filter(
			(model) =>
				model.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
				model.provider.toLowerCase().includes(modelSearch.toLowerCase()) ||
				model.modelId.toLowerCase().includes(modelSearch.toLowerCase())
		)
	);

	let selectedModel = $derived(llmModels.find((m) => m.modelId === selectedModelId));

	// Fetch data when dialog opens
	$effect(() => {
		if (open) {
			fetchApiKeys();
			fetchLlmModels();
			fetchUserSettings();
		} else {
			isDropdownOpen = false;
			activeGuide = null;
			editingService = null;
			inputValue = '';
		}
	});

	async function fetchApiKeys() {
		isLoading = true;
		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				apiKeys = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch API keys:', error);
		} finally {
			isLoading = false;
		}
	}

	async function fetchLlmModels() {
		try {
			const response = await fetch('/api/llm-models');
			if (response.ok) {
				const data = await response.json();
				llmModels = data.models || [];
			}
		} catch (error) {
			console.error('Failed to fetch LLM models:', error);
		}
	}

	async function fetchUserSettings() {
		try {
			const response = await fetch('/api/user-settings');
			if (response.ok) {
				const data = await response.json();
				selectedModelId = data.selectedModelId || null;
			}
		} catch (error) {
			console.error('Failed to fetch user settings:', error);
		}
	}

	async function handleSave(service: ApiKeyService) {
		if (!inputValue.trim()) return;
		isSaving = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ service, key: inputValue.trim() })
			});
			if (response.ok) {
				await fetchApiKeys();
				editingService = null;
				inputValue = '';
				showKey = false;
			}
		} catch (error) {
			console.error('Failed to save API key:', error);
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete(service: ApiKeyService) {
		isDeleting = service;
		deleteConfirmService = null;
		try {
			const response = await fetch(`/api/settings?service=${service}`, {
				method: 'DELETE'
			});
			if (response.ok) {
				await fetchApiKeys();
			}
		} catch (error) {
			console.error('Failed to delete API key:', error);
		} finally {
			isDeleting = null;
		}
	}

	function handleStartEdit(service: ApiKeyService) {
		editingService = service;
		inputValue = '';
		showKey = false;
	}

	function handleCancelEdit() {
		editingService = null;
		inputValue = '';
		showKey = false;
	}

	async function handleSyncModels() {
		isSyncing = true;
		try {
			const response = await fetch('/api/llm-models', { method: 'POST' });
			if (response.ok) {
				await fetchLlmModels();
			}
		} catch (error) {
			console.error('Failed to sync models:', error);
		} finally {
			isSyncing = false;
		}
	}

	async function handleModelSelect(modelId: string) {
		isSavingModel = true;
		try {
			const response = await fetch('/api/user-settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ selectedModelId: modelId })
			});
			if (response.ok) {
				selectedModelId = modelId;
				isDropdownOpen = false;
				modelSearch = '';
			}
		} catch (error) {
			console.error('Failed to save model selection:', error);
		} finally {
			isSavingModel = false;
		}
	}

	function formatPrice(price: number): string {
		if (price === 0) return 'Free';
		if (price < 0.01) return `$${price.toFixed(4)}`;
		return `$${price.toFixed(2)}`;
	}

	function handleKeydown(e: KeyboardEvent, service: ApiKeyService) {
		if (e.key === 'Enter' && inputValue.trim()) handleSave(service);
		else if (e.key === 'Escape') handleCancelEdit();
	}
</script>

<Dialog bind:open>
	<DialogContent
		class="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto rounded-xl border border-white/10 bg-black/90 p-4 shadow-2xl sm:w-full sm:rounded-2xl sm:p-6"
	>
		<DialogHeader class="mb-4 sm:mb-6">
			<DialogTitle class="text-base font-medium text-white sm:text-lg">Settings</DialogTitle>
			<DialogDescription class="sr-only">Manage your API keys and AI model settings</DialogDescription>
		</DialogHeader>

		<!-- Two Column Layout -->
		<div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
			<!-- Left Column - Platform API Keys -->
			<div class="space-y-4">
				<h3
					class="text-[10px] font-medium uppercase tracking-[0.1em] text-white/50 sm:text-[11px] sm:tracking-[0.15em]"
				>
					Platform API Keys
				</h3>

				{#if isLoading}
					<div class="flex items-center justify-center py-8">
						<Spinner class="h-5 w-5 text-white/40" />
					</div>
				{:else}
					<Accordion type="single">
						{#each ['youtube', 'rapidapi'] as service (service)}
							{@const keyState = apiKeys.find(
								(k) => k.service === (service as ApiKeyService)
							)}
							{@const config = SERVICE_CONFIG[service as ApiKeyService]}
							{@const isEditing = editingService === service}
							<AccordionItem value={service}>
								<AccordionTrigger
									class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 sm:rounded-xl sm:px-4"
								>
									<div class="flex items-center gap-1.5">
										<span class="text-xs font-medium text-white/80 sm:text-sm"
											>{config.label}</span
										>
										{#if keyState?.hasKey}
											<span
												class="inline-flex h-2 w-2 rounded-full bg-emerald-400"
											></span>
										{/if}
										<button
											class="hidden rounded-md p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white/60 sm:flex"
											onclick={(e) => {
												e.stopPropagation();
												activeGuide =
													activeGuide === (service as ApiKeyService)
														? null
														: (service as ApiKeyService);
											}}
											title="Setup guide"
										>
											<HelpCircle class="h-3.5 w-3.5" />
										</button>
									</div>
								</AccordionTrigger>
								<AccordionContent class="px-1 pt-2">
									<!-- Existing key display -->
									{#if keyState?.hasKey && !isEditing}
										<div class="mb-2 flex items-center gap-2">
											<span class="text-[10px] text-white/40 sm:text-xs">
												{keyState.maskedKey}
											</span>
											<button
												class="flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md p-1 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
												disabled={isDeleting === service}
												onclick={() =>
													(deleteConfirmService = service as ApiKeyService)}
											>
												{#if isDeleting === service}
													<Spinner class="h-3.5 w-3.5" />
												{:else}
													<Trash2 class="h-3.5 w-3.5" />
												{/if}
											</button>
										</div>
									{/if}

									<!-- Edit form -->
									{#if isEditing}
										<div class="space-y-3 pt-1">
											<div class="relative">
												<Input
													type={showKey ? 'text' : 'password'}
													bind:value={inputValue}
													onkeydown={(e: KeyboardEvent) =>
														handleKeydown(e, service as ApiKeyService)}
													placeholder={config.placeholder}
													class="w-full rounded-lg border border-white/20 bg-white/[0.05] pr-10 text-sm text-white placeholder:text-white/30"
												/>
												<button
													type="button"
													class="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/60"
													onclick={() => (showKey = !showKey)}
												>
													{#if showKey}
														<EyeOff class="h-4 w-4" />
													{:else}
														<Eye class="h-4 w-4" />
													{/if}
												</button>
											</div>
											<div class="flex justify-end gap-2 pb-1">
												<Button
													variant="outline"
													size="sm"
													onclick={handleCancelEdit}
												>
													Cancel
												</Button>
												<Button
													size="sm"
													disabled={!inputValue.trim() || isSaving}
													onclick={() =>
														handleSave(service as ApiKeyService)}
												>
													{#if isSaving}
														<Spinner class="mr-1.5 h-3 w-3" />
													{/if}
													Save
												</Button>
											</div>
										</div>
									{:else}
										<button
											class="w-full rounded-lg border border-dashed border-white/20 py-2 text-[11px] text-white/40 transition-all hover:border-white/30 hover:text-white/60 active:scale-[0.98] sm:text-xs"
											onclick={() =>
												handleStartEdit(service as ApiKeyService)}
										>
											{keyState?.hasKey ? 'Update key' : 'Add key'}
										</button>
									{/if}

									<!-- Guide panel (inline) -->
									{#if activeGuide === service}
										{@const guide =
											GUIDE_CONTENT[service as ApiKeyService]}
										<div
											class="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
										>
											<h4 class="text-xs font-medium text-white/80">
												{guide.title}
											</h4>
											<p class="mt-1 text-[11px] text-white/50">
												{guide.description}
											</p>
											<div class="mt-3 space-y-2">
												{#each guide.steps as step, i (i)}
													<div class="flex items-start gap-2.5">
														<span
															class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/60"
														>
															{i + 1}
														</span>
														<div class="min-w-0 flex-1">
															<h5
																class="text-xs font-medium text-white/80"
															>
																{step.title}
															</h5>
															<p
																class="mt-0.5 text-[11px] leading-relaxed text-white/40"
															>
																{step.description}
															</p>
															{#if step.link}
																<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external link -->
																<a
																	href={step.link.url}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/60 transition-colors hover:text-white"
																>
																	<ExternalLink
																		class="h-3 w-3"
																	/>
																	{step.link.text}
																</a>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</AccordionContent>
							</AccordionItem>
						{/each}
					</Accordion>
				{/if}
			</div>

			<!-- Right Column - AI Model -->
			<div class="space-y-4">
				<h3
					class="text-[10px] font-medium uppercase tracking-[0.1em] text-white/50 sm:text-[11px] sm:tracking-[0.15em]"
				>
					AI Model
				</h3>

				<!-- OpenRouter API Key -->
				<div
					class="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:rounded-xl sm:p-4"
				>
					<div class="mb-2">
						<div class="flex items-center gap-1.5">
							<label class="text-xs font-medium text-white/80 sm:text-sm">
								{orConfig.label}
							</label>
							{#if orKeyState?.hasKey}
								<span
									class="inline-flex h-2 w-2 rounded-full bg-emerald-400"
								></span>
							{/if}
							<button
								class="hidden rounded-md p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white/60 sm:flex"
								onclick={() =>
									(activeGuide =
										activeGuide === 'openrouter' ? null : 'openrouter')}
								title="Setup guide"
							>
								<HelpCircle class="h-3.5 w-3.5" />
							</button>
						</div>
						{#if orKeyState?.hasKey && !orIsEditing}
							<div class="mt-1.5 flex items-center gap-2">
								<span class="text-[10px] text-white/40 sm:text-xs">
									{orKeyState.maskedKey}
								</span>
								<button
									class="flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md p-1 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
									disabled={isDeleting === 'openrouter'}
									onclick={() => (deleteConfirmService = 'openrouter')}
								>
									{#if isDeleting === 'openrouter'}
										<Spinner class="h-3.5 w-3.5" />
									{:else}
										<Trash2 class="h-3.5 w-3.5" />
									{/if}
								</button>
							</div>
						{/if}
					</div>

					{#if orIsEditing}
						<div class="space-y-3 pt-1">
							<div class="relative">
								<Input
									type={showKey ? 'text' : 'password'}
									bind:value={inputValue}
									onkeydown={(e: KeyboardEvent) =>
										handleKeydown(e, 'openrouter')}
									placeholder={orConfig.placeholder}
									class="w-full rounded-lg border border-white/20 bg-white/[0.05] pr-10 text-sm text-white placeholder:text-white/30"
								/>
								<button
									type="button"
									class="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/60"
									onclick={() => (showKey = !showKey)}
								>
									{#if showKey}
										<EyeOff class="h-4 w-4" />
									{:else}
										<Eye class="h-4 w-4" />
									{/if}
								</button>
							</div>
							<div class="flex justify-end gap-2 pb-1">
								<Button variant="outline" size="sm" onclick={handleCancelEdit}>
									Cancel
								</Button>
								<Button
									size="sm"
									disabled={!inputValue.trim() || isSaving}
									onclick={() => handleSave('openrouter')}
								>
									{#if isSaving}
										<Spinner class="mr-1.5 h-3 w-3" />
									{/if}
									Save
								</Button>
							</div>
						</div>
					{:else}
						<button
							class="w-full rounded-lg border border-dashed border-white/20 py-2 text-[11px] text-white/40 transition-all hover:border-white/30 hover:text-white/60 active:scale-[0.98] sm:text-xs"
							onclick={() => handleStartEdit('openrouter')}
						>
							{orKeyState?.hasKey ? 'Update key' : 'Add key'}
						</button>
					{/if}

					<!-- Inline guide for openrouter -->
					{#if activeGuide === 'openrouter'}
						{@const guide = GUIDE_CONTENT.openrouter}
						<div
							class="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
						>
							<h4 class="text-xs font-medium text-white/80">{guide.title}</h4>
							<p class="mt-1 text-[11px] text-white/50">{guide.description}</p>
							<div class="mt-3 space-y-2">
								{#each guide.steps as step, i (i)}
									<div class="flex items-start gap-2.5">
										<span
											class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/60"
										>
											{i + 1}
										</span>
										<div class="min-w-0 flex-1">
											<h5 class="text-xs font-medium text-white/80">
												{step.title}
											</h5>
											<p
												class="mt-0.5 text-[11px] leading-relaxed text-white/40"
											>
												{step.description}
											</p>
											{#if step.link}
												<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external link -->
												<a
													href={step.link.url}
													target="_blank"
													rel="noopener noreferrer"
													class="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/60 transition-colors hover:text-white"
												>
													<ExternalLink class="h-3 w-3" />
													{step.link.text}
												</a>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- LLM Model Selection -->
				<div
					class="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:rounded-xl sm:p-4"
				>
					<div class="mb-3">
						<label class="text-xs font-medium text-white/80 sm:text-sm">
							Selected Model
						</label>
					</div>

					<!-- Model Dropdown (custom) -->
					<div class="relative mb-3">
						<button
							class="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-white/20 bg-white/[0.05] py-2.5 pl-3 pr-4 text-left text-sm text-white transition-colors hover:border-white/30 focus:border-white/40 focus:outline-none disabled:opacity-50"
							disabled={llmModels.length === 0 || isSavingModel}
							onclick={() => (isDropdownOpen = !isDropdownOpen)}
						>
							<span class="truncate">
								{#if selectedModel}
									<span class="flex items-center gap-2">
										<span class="truncate">{selectedModel.name}</span>
										<span class="text-xs text-white/40"
											>{formatPrice(selectedModel.promptPrice)}/1M</span
										>
									</span>
								{:else if llmModels.length === 0}
									<span class="text-white/40">No models - click Sync</span>
								{:else}
									<span class="text-white/40">Select a model</span>
								{/if}
							</span>
							{#if isSavingModel}
								<Spinner class="h-4 w-4 flex-shrink-0 text-white/40" />
							{:else}
								<ChevronDown
									class="h-4 w-4 flex-shrink-0 text-white/40 transition-transform {isDropdownOpen
										? 'rotate-180'
										: ''}"
								/>
							{/if}
						</button>

						{#if isDropdownOpen && llmModels.length > 0}
							<div
								class="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-lg border border-white/20 bg-black shadow-xl"
							>
								<div class="border-b border-white/10 p-2">
									<Input
										type="text"
										bind:value={modelSearch}
										placeholder="Search models..."
										class="w-full rounded-md border border-white/20 bg-white/[0.05] text-sm text-white placeholder:text-white/30"
									/>
								</div>
								<div class="max-h-48 overflow-y-auto">
									{#if filteredModels.length === 0}
										<div
											class="px-3 py-4 text-center text-sm text-white/40"
										>
											No models found
										</div>
									{:else}
										{#each filteredModels as model (model.id)}
											<button
												class="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10 {model.modelId ===
												selectedModelId
													? 'bg-white/5 text-white'
													: 'text-white/80'}"
												onclick={() => handleModelSelect(model.modelId)}
											>
												<span class="truncate pr-2">{model.name}</span>
												<span
													class="flex-shrink-0 text-xs text-white/40"
												>
													{formatPrice(model.promptPrice)}/1M
												</span>
											</button>
										{/each}
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Sync Button -->
					<button
						class="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2 text-[11px] text-white/40 transition-all hover:border-white/30 hover:text-white/60 active:scale-[0.98] disabled:opacity-50 sm:text-xs"
						disabled={isSyncing}
						onclick={handleSyncModels}
					>
						{#if isSyncing}
							<Spinner class="h-3.5 w-3.5" />
							Syncing...
						{:else}
							<RefreshCw class="h-3.5 w-3.5" />
							Sync models
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Footer note -->
		<p
			class="mt-4 text-center text-[9px] uppercase tracking-[0.1em] text-white/25 sm:mt-6 sm:text-[10px] sm:tracking-[0.15em]"
		>
			API keys are encrypted and stored securely
		</p>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation -->
<AlertDialog open={deleteConfirmService !== null}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete API Key</AlertDialogTitle>
			<AlertDialogDescription>
				Are you sure you want to remove this API key? This action cannot be undone.
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel onclick={() => (deleteConfirmService = null)}>
				Cancel
			</AlertDialogCancel>
			<AlertDialogAction
				onclick={() => {
					if (deleteConfirmService) handleDelete(deleteConfirmService);
				}}
			>
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
