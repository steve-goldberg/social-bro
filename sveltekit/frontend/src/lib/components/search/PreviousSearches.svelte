<script lang="ts">
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import type { Platform, SavedSearchWithResults, RepurposeVideo, Script } from '$lib/types';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import Bookmark from 'lucide-svelte/icons/bookmark';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import FileText from 'lucide-svelte/icons/file-text';
	import X from 'lucide-svelte/icons/x';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import MessageSquareText from 'lucide-svelte/icons/message-square-text';
	import { toast } from 'svelte-sonner';

	// --- Search History Store (localStorage-synced) ---

	export interface SearchHistory {
		id: string;
		query: string;
		platform: Platform;
		timestamp: number;
	}

	const STORAGE_KEY_PREFIX = 'social-bro-search-history';
	const MAX_HISTORY = 20;
	const HISTORY_UPDATE_EVENT = 'social-bro-history-update';

	let currentUserId: string | null = null;

	function getStorageKey(): string {
		return currentUserId ? `${STORAGE_KEY_PREFIX}-${currentUserId}` : STORAGE_KEY_PREFIX;
	}

	function readHistory(): SearchHistory[] {
		if (typeof window === 'undefined') return [];
		try {
			const stored = localStorage.getItem(getStorageKey());
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	function writeHistory(history: SearchHistory[]): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(getStorageKey(), JSON.stringify(history));
			window.dispatchEvent(new Event(HISTORY_UPDATE_EVENT));
		} catch {
			// ignore
		}
	}

	const searchHistory = writable<SearchHistory[]>([]);

	export function setSearchHistoryUserId(userId: string | null): void {
		if (currentUserId !== userId) {
			currentUserId = userId;
			searchHistory.set(readHistory());
		}
	}

	export function addSearchToHistory(query: string, platform: Platform): void {
		const history = readHistory();
		const filtered = history.filter(
			(h) => !(h.query.toLowerCase() === query.toLowerCase() && h.platform === platform)
		);
		const newSearch: SearchHistory = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
			query,
			platform,
			timestamp: Date.now(),
		};
		const updated = [newSearch, ...filtered].slice(0, MAX_HISTORY);
		writeHistory(updated);
		searchHistory.set(updated);
	}

	function removeSearchFromHistory(id: string): void {
		const history = readHistory();
		const filtered = history.filter((h) => h.id !== id);
		writeHistory(filtered);
		searchHistory.set(filtered);
	}

	// --- Component Props ---

	type TabId = Platform | 'all' | 'saved' | 'repurpose' | 'scripts';

	const TABS: { id: TabId; label: string; icon?: 'bookmark' | 'refresh' | 'file' }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'youtube', label: 'YouTube' },
		{ id: 'instagram', label: 'Instagram' },
		{ id: 'tiktok', label: 'TikTok' },
		{ id: 'saved', label: 'Saved', icon: 'bookmark' },
		{ id: 'repurpose', label: 'Repurpose', icon: 'refresh' },
		{ id: 'scripts', label: 'Scripts', icon: 'file' },
	];

	interface Props {
		userId?: string | null;
		onsearchselect: (query: string, platform: Platform) => void;
		onsavedsearchselect: (savedSearch: SavedSearchWithResults) => void;
		onrepurposeselect?: (video: RepurposeVideo) => void;
		onscriptselect?: (script: Script) => void;
		onrepurposetabclick?: () => void;
		onscriptstabclick?: () => void;
	}

	let {
		userId = null,
		onsearchselect,
		onsavedsearchselect,
		onrepurposeselect,
		onscriptselect,
		onrepurposetabclick,
		onscriptstabclick,
	}: Props = $props();

	let activeTab = $state<TabId>('all');
	let savedSearches = $state<SavedSearchWithResults[] | null>(null);
	let repurposeVideos = $state<RepurposeVideo[] | null>(null);
	let scripts = $state<Script[] | null>(null);
	let extractingTranscriptId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	let deleteConfirmType = $state<'history' | 'saved' | 'repurpose' | 'script' | null>(null);

	let searches: SearchHistory[] = $state([]);

	// Sync store to local state
	const unsubscribe = searchHistory.subscribe((val) => {
		searches = val;
	});

	// Initialize localStorage sync on mount
	onMount(() => {
		setSearchHistoryUserId(userId ?? null);

		// Listen for external updates (other tabs, etc.)
		function handleStorageUpdate() {
			searchHistory.set(readHistory());
		}
		window.addEventListener(HISTORY_UPDATE_EVENT, handleStorageUpdate);
		window.addEventListener('storage', handleStorageUpdate);

		return () => {
			window.removeEventListener(HISTORY_UPDATE_EVENT, handleStorageUpdate);
			window.removeEventListener('storage', handleStorageUpdate);
			unsubscribe();
		};
	});

	// Update userId when prop changes
	$effect(() => {
		setSearchHistoryUserId(userId ?? null);
	});

	// Lazy-load saved searches
	$effect(() => {
		if (activeTab === 'saved' && savedSearches === null) {
			fetch('/api/saved')
				.then((res) => {
					if (!res.ok) throw new Error('Failed to fetch saved searches');
					return res.json();
				})
				.then((data) => {
					savedSearches = data.savedSearches || [];
				})
				.catch(() => {
					savedSearches = [];
					toast.error('Failed to load saved');
				});
		}
	});

	// Lazy-load repurpose videos
	$effect(() => {
		if (activeTab === 'repurpose' && repurposeVideos === null) {
			fetch('/api/repurpose')
				.then((res) => {
					if (!res.ok) throw new Error('Failed to fetch repurpose videos');
					return res.json();
				})
				.then((data) => {
					repurposeVideos = data.videos || [];
				})
				.catch(() => {
					repurposeVideos = [];
					toast.error('Failed to load repurpose list');
				});
		}
	});

	// Lazy-load scripts
	$effect(() => {
		if (activeTab === 'scripts' && scripts === null) {
			fetch('/api/scripts')
				.then((res) => {
					if (!res.ok) throw new Error('Failed to fetch scripts');
					return res.json();
				})
				.then((data) => {
					scripts = data.scripts || [];
				})
				.catch(() => {
					scripts = [];
					toast.error('Failed to load scripts');
				});
		}
	});

	let filteredSearches = $derived(
		activeTab === 'all'
			? searches
			: activeTab === 'saved' || activeTab === 'repurpose' || activeTab === 'scripts'
				? []
				: searches.filter((s) => s.platform === activeTab)
	);

	let headerText = $derived(
		activeTab === 'saved'
			? 'Your saved searches'
			: activeTab === 'repurpose'
				? 'Videos to repurpose'
				: activeTab === 'scripts'
					? 'Your scripts'
					: 'Your previous searches'
	);

	let showComponent = $derived(
		searches.length > 0 ||
			activeTab === 'saved' ||
			activeTab === 'repurpose' ||
			activeTab === 'scripts'
	);

	function handleDeleteHistory(e: MouseEvent, id: string) {
		e.stopPropagation();
		removeSearchFromHistory(id);
	}

	async function handleDeleteSaved(e: MouseEvent, id: string) {
		e.stopPropagation();
		try {
			const response = await fetch(`/api/saved?id=${id}`, { method: 'DELETE' });
			if (response.ok) {
				savedSearches = savedSearches?.filter((s) => s.id !== id) ?? null;
				toast.success('Deleted');
			} else {
				toast.error('Failed to delete');
			}
		} catch {
			toast.error('Failed to delete');
		}
	}

	async function handleDeleteRepurpose(e: MouseEvent, id: string) {
		e.stopPropagation();
		try {
			const response = await fetch(`/api/repurpose?id=${id}`, { method: 'DELETE' });
			if (response.ok) {
				repurposeVideos = repurposeVideos?.filter((v) => v.id !== id) ?? null;
				toast.success('Removed from repurpose list');
			} else {
				toast.error('Failed to delete');
			}
		} catch {
			toast.error('Failed to delete');
		}
	}

	async function handleDeleteScript(e: MouseEvent, id: string) {
		e.stopPropagation();
		try {
			const response = await fetch(`/api/scripts?id=${id}`, { method: 'DELETE' });
			if (response.ok) {
				scripts = scripts?.filter((s) => s.id !== id) ?? null;
				toast.success('Script deleted');
			} else {
				toast.error('Failed to delete');
			}
		} catch {
			toast.error('Failed to delete');
		}
	}

	async function handleExtractTranscript(e: MouseEvent, video: RepurposeVideo) {
		e.stopPropagation();
		if (extractingTranscriptId || video.platform !== 'youtube') return;

		extractingTranscriptId = video.id;
		try {
			const response = await fetch('/api/transcript', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ repurposeVideoId: video.id }),
			});

			const data = await response.json();

			if (response.ok) {
				scripts = null;
				if (data.alreadyExists) {
					toast.success('Transcript already extracted');
				} else {
					toast.success('Transcript extracted and saved to Scripts');
				}
				activeTab = 'scripts';
			} else {
				toast.error(data.error || 'Failed to extract transcript');
			}
		} catch {
			toast.error('Failed to extract transcript');
		} finally {
			extractingTranscriptId = null;
		}
	}

	function handleTabClick(tabId: TabId) {
		if (tabId === 'repurpose' && onrepurposetabclick) {
			onrepurposetabclick();
			return;
		}
		if (tabId === 'scripts' && onscriptstabclick) {
			onscriptstabclick();
			return;
		}
		activeTab = tabId;
	}

	function confirmDelete(id: string, type: 'history' | 'saved' | 'repurpose' | 'script') {
		deleteConfirmId = id;
		deleteConfirmType = type;
	}

	async function executeDelete(e: MouseEvent) {
		if (!deleteConfirmId || !deleteConfirmType) return;
		switch (deleteConfirmType) {
			case 'history':
				handleDeleteHistory(e, deleteConfirmId);
				break;
			case 'saved':
				await handleDeleteSaved(e, deleteConfirmId);
				break;
			case 'repurpose':
				await handleDeleteRepurpose(e, deleteConfirmId);
				break;
			case 'script':
				await handleDeleteScript(e, deleteConfirmId);
				break;
		}
		deleteConfirmId = null;
		deleteConfirmType = null;
	}
</script>

{#if showComponent}
	<div class="w-full max-w-4xl">
		<!-- Header -->
		<h2 class="mb-3 sm:mb-4 text-xs sm:text-sm font-medium text-white/50">
			{headerText}
		</h2>

		<!-- Tabs -->
		<div class="mb-3 sm:mb-4 flex items-center gap-1 overflow-x-auto scrollbar-hidden pb-1">
			{#each TABS as tab (tab.id)}
				<button
					onclick={() => handleTabClick(tab.id)}
					class="flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 min-h-[36px] text-[10px] sm:text-xs font-medium transition-all duration-150 whitespace-nowrap active:scale-95 {activeTab ===
					tab.id
						? 'bg-white text-black'
						: 'text-white/50 hover:text-white/80'}"
				>
					{#if tab.icon === 'bookmark'}
						<Bookmark class="h-3 w-3" />
					{:else if tab.icon === 'refresh'}
						<RefreshCw class="h-3 w-3" />
					{:else if tab.icon === 'file'}
						<FileText class="h-3 w-3" />
					{/if}
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Content tiles -->
		<div
			class="flex h-[120px] sm:h-[176px] flex-wrap content-start gap-1.5 sm:gap-2 overflow-hidden"
		>
			{#if activeTab === 'saved'}
				{#if savedSearches === null}
					<p class="text-xs sm:text-sm text-white/40">Loading saved searches...</p>
				{:else if savedSearches.length === 0}
					<p class="text-xs sm:text-sm text-white/40">No saved searches yet</p>
				{:else}
					{#each savedSearches as saved (saved.id)}
						<div class="group relative">
							<button
								onclick={() => onsavedsearchselect(saved)}
								class="flex items-center gap-1.5 sm:gap-2 max-w-[140px] sm:max-w-[200px] truncate rounded-lg border border-white/20 bg-white/[0.08] px-2.5 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-7 min-h-[36px] text-xs sm:text-sm text-white/80 transition-all duration-150 hover:border-white/30 hover:bg-white/[0.12] hover:text-white active:scale-95"
							>
								<Bookmark class="h-3 w-3 shrink-0 text-white/50" />
								<span class="truncate">{saved.query}</span>
								<span class="shrink-0 text-[9px] sm:text-[10px] text-white/40">
									{saved.results.length}
								</span>
							</button>
							<button
								onclick={(e) => handleDeleteSaved(e, saved.id)}
								class="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 sm:text-white/0 transition-all sm:group-hover:text-white/40 hover:!text-white/80 hover:bg-white/10"
							>
								<X class="h-3 w-3" />
							</button>
						</div>
					{/each}
				{/if}
			{:else if activeTab === 'repurpose'}
				{#if repurposeVideos === null}
					<p class="text-xs sm:text-sm text-white/40">Loading repurpose list...</p>
				{:else if repurposeVideos.length === 0}
					<p class="text-xs sm:text-sm text-white/40">No videos saved for repurposing yet</p>
				{:else}
					{#each repurposeVideos as video (video.id)}
						<div class="group relative flex items-center gap-1">
							<button
								onclick={() => onrepurposeselect?.(video)}
								class="flex items-center gap-1.5 sm:gap-2 max-w-[140px] sm:max-w-[180px] truncate rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[36px] text-xs sm:text-sm text-white/80 transition-all duration-150 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-white active:scale-95"
							>
								<RefreshCw class="h-3 w-3 shrink-0 text-emerald-400/70" />
								<span class="truncate">{video.title}</span>
							</button>
							{#if video.platform === 'youtube'}
								<button
									onclick={(e) => handleExtractTranscript(e, video)}
									disabled={extractingTranscriptId === video.id}
									class="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 min-h-[36px] text-xs text-blue-400 transition-all duration-150 hover:border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
									title="Extract transcript"
								>
									{#if extractingTranscriptId === video.id}
										<Loader2 class="h-3.5 w-3.5 animate-spin" />
									{:else}
										<MessageSquareText class="h-3.5 w-3.5" />
									{/if}
								</button>
							{/if}
							<button
								onclick={(e) => handleDeleteRepurpose(e, video.id)}
								class="rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 transition-all hover:text-white/80 hover:bg-white/10"
							>
								<X class="h-3 w-3" />
							</button>
						</div>
					{/each}
				{/if}
			{:else if activeTab === 'scripts'}
				{#if scripts === null}
					<p class="text-xs sm:text-sm text-white/40">Loading scripts...</p>
				{:else if scripts.length === 0}
					<p class="text-xs sm:text-sm text-white/40">No scripts created yet</p>
				{:else}
					{#each scripts as script (script.id)}
						<div class="group relative">
							<button
								onclick={() => onscriptselect?.(script)}
								class="flex items-center gap-1.5 sm:gap-2 max-w-[160px] sm:max-w-[220px] truncate rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-7 min-h-[36px] text-xs sm:text-sm text-white/80 transition-all duration-150 hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-white active:scale-95"
							>
								<FileText class="h-3 w-3 shrink-0 text-purple-400/70" />
								<span class="truncate">{script.title}</span>
								<span
									class="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full {script.status ===
									'completed'
										? 'bg-green-500/20 text-green-400'
										: script.status === 'in_progress'
											? 'bg-yellow-500/20 text-yellow-400'
											: 'bg-white/10 text-white/40'}"
								>
									{script.status === 'in_progress' ? 'WIP' : script.status}
								</span>
							</button>
							<button
								onclick={(e) => handleDeleteScript(e, script.id)}
								class="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 sm:text-white/0 transition-all sm:group-hover:text-white/40 hover:!text-white/80 hover:bg-white/10"
							>
								<X class="h-3 w-3" />
							</button>
						</div>
					{/each}
				{/if}
			{:else}
				{#each filteredSearches as search (search.id)}
					<div class="group relative">
						<button
							onclick={() => onsearchselect(search.query, search.platform)}
							class="max-w-[120px] sm:max-w-[180px] truncate rounded-lg border border-white/10 bg-white/5 px-2.5 sm:px-3 py-1.5 sm:py-2 pr-6 sm:pr-7 min-h-[36px] text-xs sm:text-sm text-white/70 transition-all duration-150 hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
						>
							{search.query}
						</button>
						<button
							onclick={(e) => handleDeleteHistory(e, search.id)}
							class="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 rounded p-1 min-h-[28px] min-w-[28px] flex items-center justify-center text-white/30 sm:text-white/0 transition-all sm:group-hover:text-white/40 hover:!text-white/80 hover:bg-white/10"
						>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Delete confirmation dialog -->
	<AlertDialog.AlertDialog bind:open={
		() => deleteConfirmId !== null,
		(v) => {
			if (!v) {
				deleteConfirmId = null;
				deleteConfirmType = null;
			}
		}
	}>
		<AlertDialog.AlertDialogContent>
			<AlertDialog.AlertDialogHeader>
				<AlertDialog.AlertDialogTitle>Confirm deletion</AlertDialog.AlertDialogTitle>
				<AlertDialog.AlertDialogDescription>
					Are you sure you want to delete this item? This action cannot be undone.
				</AlertDialog.AlertDialogDescription>
			</AlertDialog.AlertDialogHeader>
			<AlertDialog.AlertDialogFooter>
				<AlertDialog.AlertDialogCancel>Cancel</AlertDialog.AlertDialogCancel>
				<AlertDialog.AlertDialogAction onclick={executeDelete}>Delete</AlertDialog.AlertDialogAction>
			</AlertDialog.AlertDialogFooter>
		</AlertDialog.AlertDialogContent>
	</AlertDialog.AlertDialog>
{/if}
