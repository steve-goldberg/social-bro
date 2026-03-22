<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { PlatformSelector } from '$lib/components/search/index.js';
	import { SearchInput } from '$lib/components/search/index.js';
	import { PreviousSearches } from '$lib/components/search/index.js';
	import { WelcomeHeader } from '$lib/components/search/index.js';
	import { PreLoader } from '$lib/components/preloader/index.js';
	import { ProcessingLoader } from '$lib/components/processing-loader/index.js';
	import { DataTable } from '$lib/components/data-table/index.js';
	import {
		youtubeColumns,
		tiktokColumns,
		instagramColumns,
		repurposeColumns,
		scriptsColumns
	} from '$lib/components/data-table/columns.js';
	import { SettingsModal } from '$lib/components/settings/index.js';
	import { UserMenu } from '$lib/components/auth/index.js';
	import {
		searchYouTubeWithDetails,
		searchTikTokWithDetails,
		searchInstagramWithDetails
	} from '$lib/api';
	import type {
		Platform,
		YouTubeTableData,
		TikTokTableData,
		SavedSearchWithResults,
		RepurposeVideo,
		Script
	} from '$lib/types';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import BookmarkCheck from '@lucide/svelte/icons/bookmark-check';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';

	type ViewMode = 'search' | 'results' | 'repurpose' | 'scripts';

	// Core state
	let searchQuery = $state('');
	let selectedPlatform = $state<Platform>('youtube');
	let showPreLoader = $state(true);
	let isSearching = $state(false);
	let tableData = $state<(YouTubeTableData | TikTokTableData)[]>([]);
	let hasSearched = $state(false);
	let isSaving = $state(false);
	let isSaved = $state(false);
	let viewingSavedSearch = $state<SavedSearchWithResults | null>(null);
	let isSettingsOpen = $state(false);
	let hasYouTubeKey = $state<boolean | null>(null);

	// Repurpose & Scripts state
	let viewMode = $state<ViewMode>('search');
	let repurposeVideos = $state<RepurposeVideo[]>([]);
	let scripts = $state<Script[]>([]);
	let isLoadingRepurpose = $state(false);
	let isLoadingScripts = $state(false);
	let selectedScript = $state<Script | null>(null);
	let viewingRepurposed = $state(false);
	let currentHookIndex = $state(0);
	let isRegeneratingHooks = $state(false);

	// Processing loader state
	let isProcessing = $state(false);
	let processingStatus = $state('');
	let processingSubtitle = $state<string | undefined>();
	let processingProgress = $state<{ current: number; total: number } | undefined>();

	// Check YouTube API key on settings close
	$effect(() => {
		// Re-run when isSettingsOpen changes (triggers on close)
		void isSettingsOpen;
		fetch('/api/settings')
			.then((res) => (res.ok ? res.json() : []))
			.then((data) => {
				if (!Array.isArray(data)) {
					hasYouTubeKey = false;
					return;
				}
				const ytKey = data.find(
					(k: { service: string; hasKey: boolean }) => k.service === 'youtube'
				);
				hasYouTubeKey = ytKey?.hasKey ?? false;
			})
			.catch(() => (hasYouTubeKey = false));
	});

	async function handleSearch() {
		if (!searchQuery.trim() || isSearching) return;

		if (selectedPlatform === 'youtube' && !hasYouTubeKey) {
			toast.error('Add YouTube API key in Settings');
			isSettingsOpen = true;
			return;
		}

		isSearching = true;
		hasSearched = true;
		isSaved = false;
		viewingSavedSearch = null;

		try {
			let results: YouTubeTableData[] | TikTokTableData[];
			if (selectedPlatform === 'tiktok') {
				results = await searchTikTokWithDetails(searchQuery);
			} else if (selectedPlatform === 'instagram') {
				results = await searchInstagramWithDetails(searchQuery);
			} else {
				results = await searchYouTubeWithDetails(searchQuery);
			}
			tableData = results;
			if (results.length === 0) toast.error('No results found');
		} catch (error) {
			console.error('Search failed:', error);
			toast.error(error instanceof Error ? error.message : 'Search failed');
		} finally {
			isSearching = false;
		}
	}

	async function handleSaveSearch() {
		if (isSaving || isSaved || tableData.length === 0) return;
		isSaving = true;
		try {
			const response = await fetch('/api/saved', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: searchQuery.trim(), platform: selectedPlatform, data: tableData })
			});
			if (response.ok) {
				isSaved = true;
				toast.success('Search saved');
			} else {
				toast.error('Failed to save');
			}
		} catch {
			toast.error('Failed to save');
		} finally {
			isSaving = false;
		}
	}

	function handleSearchSelect(query: string, platform: Platform) {
		searchQuery = query;
		selectedPlatform = platform;
	}

	function handleSavedSearchSelect(savedSearch: SavedSearchWithResults) {
		viewingSavedSearch = savedSearch;
		searchQuery = savedSearch.query;
		selectedPlatform = savedSearch.platform;
		tableData = savedSearch.results;
		hasSearched = true;
		isSaved = true;
	}

	function handleBackToSearch() {
		hasSearched = false;
		tableData = [];
		searchQuery = '';
		isSaved = false;
		viewingSavedSearch = null;
		viewMode = 'search';
		selectedScript = null;
	}

	async function fetchRepurposeVideos() {
		isLoadingRepurpose = true;
		try {
			const response = await fetch('/api/repurpose');
			if (response.ok) {
				const data = await response.json();
				repurposeVideos = data.videos || [];
			}
		} catch {
			toast.error('Failed to load repurpose list');
		} finally {
			isLoadingRepurpose = false;
		}
	}

	async function fetchScripts() {
		isLoadingScripts = true;
		try {
			const response = await fetch('/api/scripts');
			if (response.ok) {
				const data = await response.json();
				scripts = data.scripts || [];
			}
		} catch {
			toast.error('Failed to load scripts');
		} finally {
			isLoadingScripts = false;
		}
	}

	function handleRepurposeTabClick() {
		viewMode = 'repurpose';
		hasSearched = false;
		fetchRepurposeVideos();
	}

	function handleScriptsTabClick() {
		viewMode = 'scripts';
		hasSearched = false;
		selectedScript = null;
		fetchScripts();
	}

	async function handleDeleteRepurpose(id: string) {
		try {
			const response = await fetch(`/api/repurpose?id=${id}`, { method: 'DELETE' });
			if (response.ok) {
				repurposeVideos = repurposeVideos.filter((v) => v.id !== id);
				toast.success('Video removed');
			}
		} catch {
			toast.error('Failed to delete');
		}
	}

	async function handleDeleteScript(id: string) {
		try {
			const response = await fetch(`/api/scripts?id=${id}`, { method: 'DELETE' });
			if (response.ok) {
				scripts = scripts.filter((s) => s.id !== id);
				toast.success('Script deleted');
			}
		} catch {
			toast.error('Failed to delete');
		}
	}

	function handleViewOriginalScript(script: Script) {
		selectedScript = script;
		viewingRepurposed = false;
	}

	function handleViewRepurposedScript(script: Script) {
		selectedScript = script;
		viewingRepurposed = true;
		currentHookIndex = 0;
	}

	async function handleScriptRepurposed() {
		try {
			const response = await fetch('/api/scripts');
			if (response.ok) {
				const data = await response.json();
				scripts = data.scripts;
			}
		} catch {
			/* ignore */
		}
	}

	async function handleRegenerateHooks() {
		if (!selectedScript || isRegeneratingHooks) return;
		isRegeneratingHooks = true;
		try {
			const response = await fetch(`/api/scripts/${selectedScript.id}/regenerate-hooks`, {
				method: 'POST'
			});
			const data = await response.json();
			if (response.ok && data.hooks) {
				selectedScript = { ...selectedScript, hooks: data.hooks };
				scripts = scripts.map((s) =>
					s.id === selectedScript!.id ? { ...s, hooks: data.hooks } : s
				);
				currentHookIndex = 0;
				toast.success('Hooks regenerated');
			} else {
				toast.error(data.error || 'Failed to regenerate hooks');
			}
		} catch {
			toast.error('Failed to regenerate hooks');
		} finally {
			isRegeneratingHooks = false;
		}
	}

	async function handleStartRepurpose(script: Script): Promise<boolean> {
		const wordCount = script.script.trim().split(/\s+/).filter(Boolean).length;
		const estimatedChunks = Math.ceil(wordCount / 4000);

		isProcessing = true;
		processingStatus = 'Repurposing transcript';
		processingSubtitle = `${wordCount.toLocaleString()} words · ~${estimatedChunks} chunk${estimatedChunks > 1 ? 's' : ''}`;

		try {
			const response = await fetch(`/api/scripts/${script.id}/repurpose`, { method: 'POST' });
			const data = await response.json();
			if (response.ok) {
				toast.success(`Repurposed (${data.chunksProcessed} chunks)`);
				await fetchScripts();
				return true;
			} else {
				toast.error(data.error || 'Failed to repurpose');
				return false;
			}
		} catch {
			toast.error('Failed to repurpose');
			return false;
		} finally {
			isProcessing = false;
			processingStatus = '';
			processingSubtitle = undefined;
		}
	}

	async function handleUrlRepurpose(url: string) {
		isProcessing = true;
		processingStatus = 'Extracting transcript';
		processingSubtitle = 'Connecting to YouTube...';
		processingProgress = undefined;

		try {
			const response = await fetch('/api/repurpose-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
				body: JSON.stringify({ url })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to repurpose');
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const events = buffer.split('\n\n');
					buffer = events.pop() || '';

					for (const event of events) {
						if (!event.trim()) continue;
						const lines = event.split('\n');
						let eventType = '';
						let eventData = '';

						for (const line of lines) {
							if (line.startsWith('event: ')) eventType = line.slice(7);
							else if (line.startsWith('data: ')) eventData = line.slice(6);
						}
						if (!eventType || !eventData) continue;

						let data;
						try {
							data = JSON.parse(eventData);
						} catch {
							continue;
						}

						if (eventType === 'progress') {
							const stepMessages: Record<string, { status: string; subtitle: string; baseProgress: number }> = {
								extracting: { status: 'Extracting transcript', subtitle: 'Fetching video content...', baseProgress: 10 },
								analyzing: { status: 'Analyzing content', subtitle: 'Preparing for repurposing...', baseProgress: 20 },
								processing_chunk: { status: 'Repurposing content', subtitle: 'AI is transforming your script...', baseProgress: 30 },
								generating_hooks: { status: 'Generating hooks', subtitle: 'Creating engaging openers...', baseProgress: 90 },
								finalizing: { status: 'Finalizing', subtitle: 'Almost done...', baseProgress: 95 }
							};
							const stepInfo = stepMessages[data.step] || { status: data.message, subtitle: '', baseProgress: 50 };
							processingStatus = stepInfo.status;
							processingSubtitle = stepInfo.subtitle;

							if (data.step === 'processing_chunk' && data.current && data.total) {
								processingProgress = { current: Math.round((data.current / data.total) * 55 + 30), total: 100 };
							} else {
								processingProgress = { current: stepInfo.baseProgress, total: 100 };
							}
						} else if (eventType === 'complete') {
							toast.success(data.alreadyExists ? 'Script already exists' : `Repurposed (${data.chunksProcessed} chunks)`);
							await fetchScripts();
							searchQuery = '';
							viewMode = 'scripts';
						} else if (eventType === 'error') {
							throw new Error(data.error || 'Failed to repurpose');
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to repurpose');
		} finally {
			isProcessing = false;
			processingStatus = '';
			processingSubtitle = undefined;
			processingProgress = undefined;
		}
	}

	// Derived columns
	const currentRepurposeColumns = $derived(
		repurposeColumns(() => fetchScripts(), handleDeleteRepurpose, handleScriptsTabClick)
	);
	const currentScriptsColumns = $derived(
		scriptsColumns(handleViewOriginalScript, handleViewRepurposedScript, handleDeleteScript, handleScriptRepurposed, handleStartRepurpose)
	);
	const currentColumns = $derived(
		selectedPlatform === 'tiktok' ? tiktokColumns : selectedPlatform === 'instagram' ? instagramColumns : youtubeColumns
	);

	// Script viewer helpers
	function formatTime(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

{#if showPreLoader}
	<PreLoader onComplete={() => (showPreLoader = false)} />
{/if}

{#if isProcessing}
	<ProcessingLoader status={processingStatus} subtitle={processingSubtitle} progress={processingProgress} />
{/if}

{#if viewMode === 'repurpose'}
	<!-- Repurpose List View -->
	<div class="min-h-screen px-3 py-4 sm:px-4 sm:py-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-4 sm:mb-8">
				<button onclick={handleBackToSearch} class="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95">
					<ArrowLeft class="h-3.5 w-3.5" /> Back
				</button>
				<h1 class="text-lg font-semibold text-white sm:text-2xl">Repurpose List</h1>
				<p class="mt-1 text-xs text-white/60 sm:text-sm">
					{isLoadingRepurpose ? 'Loading...' : `${repurposeVideos.length} videos saved`}
				</p>
			</div>
			<DataTable columns={currentRepurposeColumns} data={repurposeVideos} isLoading={isLoadingRepurpose} skeletonRows={5} />
		</div>
	</div>
{:else if viewMode === 'scripts' && selectedScript}
	<!-- Script Viewer -->
	{@const displayContent = viewingRepurposed ? selectedScript.repurposedScript || selectedScript.script : selectedScript.script}
	{@const hooks = viewingRepurposed && selectedScript.hooks && Array.isArray(selectedScript.hooks) ? selectedScript.hooks as string[] : []}
	{@const paragraphs = displayContent.split(/\n\n+/).filter((p: string) => p.trim())}

	<div class="min-h-screen px-3 py-4 sm:px-4 sm:py-8">
		<div class="mx-auto max-w-4xl">
			<div class="mb-4 sm:mb-8">
				<button onclick={() => (selectedScript = null)} class="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95">
					<ArrowLeft class="h-3.5 w-3.5" /> Back
				</button>
				<h1 class="text-base font-semibold text-white sm:text-lg">{selectedScript.title}</h1>
				<div class="mt-2 flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60">{new Date(selectedScript.createdAt).toLocaleDateString()}</span>
					<span class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/60">{displayContent.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
					{#if viewingRepurposed}
						<span class="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-400">Repurposed</span>
					{/if}
					{#if hooks.length > 0}
						<span class="inline-flex items-center rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-400">{hooks.length} hooks</span>
					{/if}
				</div>
			</div>
			<div class="max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
				<div class="space-y-4">
					{#each paragraphs as paragraph, i}
						{@const isFirst = i === 0}
						{@const hasHooks = hooks.length > 0 && isFirst && viewingRepurposed}
						{@const displayText = hasHooks ? hooks[currentHookIndex] : paragraph.trim()}
						<div class="group -mx-3 flex cursor-default gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10">
							<div class="flex-1">
								{#if hasHooks}
									<div>
										<div class="mb-1.5 flex items-center gap-2">
											<button onclick={() => (currentHookIndex = (currentHookIndex + 1) % hooks.length)} class="inline-flex items-center gap-1.5 text-[10px] font-medium text-purple-400">
												<span class="rounded bg-purple-500/20 px-1.5 py-0.5">Hook {currentHookIndex + 1}/{hooks.length}</span>
												<span class="text-purple-400/50">click to alternate</span>
											</button>
											<button onclick={handleRegenerateHooks} disabled={isRegeneratingHooks} class="inline-flex items-center gap-1 text-[10px] text-white/40 transition-colors hover:text-white/70 disabled:opacity-50">
												<RefreshCw class="h-3 w-3 {isRegeneratingHooks ? 'animate-spin' : ''}" />
												<span>{isRegeneratingHooks ? 'Regenerating...' : 'Retry'}</span>
											</button>
										</div>
										<button onclick={() => (currentHookIndex = (currentHookIndex + 1) % hooks.length)} class="w-full text-left">
											<p class="text-sm leading-7 text-white/80 transition-colors group-hover:text-white sm:text-base">{displayText}</p>
										</button>
									</div>
								{:else}
									<p class="text-sm leading-7 text-white/80 transition-colors group-hover:text-white sm:text-base">{displayText}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{:else if viewMode === 'scripts'}
	<!-- Scripts List View -->
	<div class="min-h-screen px-3 py-4 sm:px-4 sm:py-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-4 sm:mb-8">
				<button onclick={handleBackToSearch} class="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95">
					<ArrowLeft class="h-3.5 w-3.5" /> Back
				</button>
				<h1 class="text-lg font-semibold text-white sm:text-2xl">Scripts</h1>
				<p class="mt-1 text-xs text-white/60 sm:text-sm">
					{isLoadingScripts ? 'Loading...' : `${scripts.length} scripts`}
				</p>
			</div>
			<DataTable columns={currentScriptsColumns} data={scripts} isLoading={isLoadingScripts} skeletonRows={5} />
		</div>
	</div>
{:else if hasSearched}
	<!-- Results View -->
	<div class="min-h-screen px-3 py-4 sm:px-4 sm:py-8">
		<div class="mx-auto max-w-7xl">
			<div class="mb-4 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<button onclick={handleBackToSearch} class="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95">
						<ArrowLeft class="h-3.5 w-3.5" /> Back
					</button>
					<h1 class="text-lg font-semibold text-white sm:text-2xl">
						{viewingSavedSearch ? `Saved: "${searchQuery}"` : `Results for "${searchQuery}"`}
					</h1>
					<p class="mt-1 text-xs text-white/60 sm:text-sm">
						{isSearching ? 'Searching...' : `${tableData.length} videos found`}
					</p>
				</div>

				{#if !isSearching && tableData.length > 0}
					<button onclick={handleSaveSearch} disabled={isSaving || isSaved}
						class="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-all duration-200 active:scale-95 sm:rounded-xl sm:text-[11px] sm:tracking-[0.15em] {isSaved ? 'border-white/30 bg-white/10 text-white/70' : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'}">
						{#if isSaving}
							<Loader2 class="h-4 w-4 animate-spin" />
						{:else if isSaved}
							<BookmarkCheck class="h-4 w-4" />
						{:else}
							<Bookmark class="h-4 w-4" />
						{/if}
						{isSaved ? 'Saved' : 'Save'}
					</button>
				{/if}
			</div>
			<DataTable columns={currentColumns} data={tableData} isLoading={isSearching} skeletonRows={10} />
		</div>
	</div>
{:else}
	<!-- Search View (Main) -->
	<div class="relative flex min-h-screen flex-col items-center justify-center px-3 sm:px-4">
		<!-- Top Right Controls -->
		<div class="fixed right-3 top-3 z-40 flex items-center gap-3 sm:right-6 sm:top-6">
			<UserMenu />
			<button onclick={() => (isSettingsOpen = true)} class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95">
				<SettingsIcon class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Settings</span>
			</button>
		</div>

		<!-- Main content -->
		<div class="flex w-full max-w-[57.75rem] flex-col items-center gap-5 pt-16 sm:gap-8 sm:pt-0">
			<WelcomeHeader />
			<PlatformSelector selected={selectedPlatform} onselect={(p) => (selectedPlatform = p)} />
			<div class="w-full max-w-2xl px-1 sm:px-0">
				<SearchInput
					value={searchQuery}
					onchange={(v) => (searchQuery = v)}
					onsearch={handleSearch}
					onurlrepurpose={handleUrlRepurpose}
					placeholder="Search for videos, creators, or topics..."
					isLoading={isSearching || isProcessing}
					platform={selectedPlatform}
				/>
			</div>
		</div>

		<!-- Previous Searches -->
		<div class="absolute bottom-4 left-0 right-0 flex justify-center px-3 sm:bottom-8 sm:px-4">
			<PreviousSearches
				onSearchSelect={handleSearchSelect}
				onSavedSearchSelect={handleSavedSearchSelect}
				onRepurposeTabClick={handleRepurposeTabClick}
				onScriptsTabClick={handleScriptsTabClick}
			/>
		</div>
	</div>
	<SettingsModal isOpen={isSettingsOpen} onclose={() => (isSettingsOpen = false)} />
{/if}
